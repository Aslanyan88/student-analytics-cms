'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, Clock, Users, BookOpen, AlertTriangle, 
  FileText, Eye, Edit, CheckCircle2, XCircle, 
  Download, AlertCircle, Mail
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { ToastContainer, toast } from 'react-toastify';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Submission {
  id: string;
  student: Student;
  status: string;
  submittedAt: string | null;
  grade: number | null;
  feedback: string | null;
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  createdAt: string;
  isActive: boolean;
  classroom: {
    id: string;
    name: string;
  };
  creator: {
    id: string;
    firstName: string;
    lastName: string;
  };
  submissions: Submission[];
  totalStudents: number;
}

export default function AssignmentDetails() {
  const { user, token } = useAuth();
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [emailSending, setEmailSending] = useState(false);
  
  // Grade and feedback states for the dialog
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null);
  const [grade, setGrade] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      try {
        setLoading(true);
        
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/teacher/assignments/${assignmentId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setAssignment(response.data.assignment);
        setLoading(false);
      } catch (err: any) {
        setError('Failed to load assignment details');
        setLoading(false);
        console.error('Error fetching assignment details:', err);
      }
    };

    fetchAssignmentDetails();
  }, [assignmentId, token]);

  // Format date to readable format
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return format(date, 'MMMM d, yyyy h:mm a');
  };

  // Check if assignment is overdue
  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  // Get status badge for the assignment
  const getStatusBadge = () => {
    if (!assignment) return null;
    
    if (!assignment.isActive) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Inactive</Badge>;
    }
    
    if (!assignment.dueDate) {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Open</Badge>;
    }
    
    if (isOverdue(assignment.dueDate)) {
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Past Due</Badge>;
    }
    
    return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
  };

  // Handle opening the grade dialog for a submission
  const openGradeDialog = (submission: Submission) => {
    console.log('Opening grade dialog for submission:', submission);
    setCurrentSubmission(submission);
    setGrade(submission.grade !== null ? submission.grade.toString() : '');
    setFeedback(submission.feedback || '');
    setDialogOpen(true);
  };

  // Handle submitting the grade and feedback
  const handleSubmitGrade = async () => {
    if (!currentSubmission) {
      console.error('No current submission selected');
      return;
    }
    
    try {
      console.log('Submitting grade:', {
        submissionId: currentSubmission.id,
        grade,
        feedback,
      });
      
      setSubmitting({...submitting, [currentSubmission.id]: true});
      
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/teacher/submissions/${currentSubmission.id}`,
        {
          grade: grade ? parseFloat(grade) : null,
          feedback
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Grade submission response:', response.data);
      
      // Update the local state
      if (assignment) {
        const updatedSubmissions = assignment.submissions.map(submission => 
          submission.id === currentSubmission.id
            ? {
                ...submission,
                grade: grade ? parseFloat(grade) : null,
                feedback
              }
            : submission
        );
        
        setAssignment({
          ...assignment,
          submissions: updatedSubmissions
        });
      }
      
      setSubmitting({...submitting, [currentSubmission.id]: false});
      setDialogOpen(false);
      setSuccessMessage('Grade saved successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error updating submission:', err);
      setSubmitting({...submitting, [currentSubmission.id]: false});
    }
  };

  // Send reminder emails to students who haven't submitted
  const sendReminderEmails = async () => {
    if (!assignment) return;
    
    try {
      setEmailSending(true);
      
      // Get IDs of students who haven't submitted
      const pendingStudentIds = assignment.submissions
        .filter(submission => submission.status === 'PENDING')
        .map(submission => submission.student.id);
      
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/teacher/assignments/${assignment.id}/send-reminders`,
        {
          studentIds: pendingStudentIds
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setEmailSending(false);
      setSuccessMessage('Reminder emails sent successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error sending reminder emails:', err);
      setEmailSending(false);
    }
  };

  // Get submission status counts
  const getSubmissionStatusCounts = () => {
    if (!assignment) return { completed: 0, pending: 0, overdue: 0, total: 0 };
    
    const completed = assignment.submissions.filter(s => s.status === 'COMPLETED').length;
    const pending = assignment.submissions.filter(s => s.status === 'PENDING').length;
    const overdue = assignment.submissions.filter(s => s.status === 'OVERDUE').length;
    
    return {
      completed,
      pending,
      overdue,
      total: assignment.submissions.length
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="p-4">
        <div className="bg-red-50 text-red-800 p-4 rounded-md flex items-center mb-6">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <span>{error || 'Assignment not found'}</span>
        </div>
        <Button asChild>
          <Link href="/dashboard/teacher/assignments">Back to Assignments</Link>
        </Button>
      </div>
    );
  }

  const statusCounts = getSubmissionStatusCounts();

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 text-green-800 p-4 rounded-md flex items-center fixed top-4 right-4 z-50 shadow-md">
          <CheckCircle2 className="h-5 w-5 mr-2" />
          <span>{successMessage}</span>
        </div>
      )}
      
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/teacher/assignments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center">
            {assignment.title} {getStatusBadge()}
          </h1>
          <div className="text-muted-foreground text-sm mt-1">
            <Link 
              href={`/dashboard/teacher/classrooms/${assignment.classroom.id}`}
              className="hover:underline"
            >
              {assignment.classroom.name}
            </Link>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/teacher/assignments/${assignment.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Due Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              {formatDate(assignment.dueDate)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {statusCounts.completed} / {statusCounts.total} completed
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {statusCounts.pending} pending, {statusCounts.overdue} overdue
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Created By</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {assignment.creator.firstName} {assignment.creator.lastName}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {formatDate(assignment.createdAt)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            {assignment.description ? (
              <p>{assignment.description}</p>
            ) : (
              <p className="text-muted-foreground">No description provided</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Student Submissions</h2>
        {statusCounts.pending > 0 && (
          <Button variant="outline" onClick={sendReminderEmails} disabled={emailSending}>
            {emailSending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" /> Send Reminders
              </>
            )}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignment.submissions.map(submission => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">
                    {submission.student.firstName} {submission.student.lastName}
                  </TableCell>
                  <TableCell>
                    {submission.status === 'COMPLETED' ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
                      </Badge>
                    ) : submission.status === 'OVERDUE' ? (
                      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                        <AlertCircle className="h-3 w-3 mr-1" /> Overdue
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        <Clock className="h-3 w-3 mr-1" /> Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {submission.submittedAt ? formatDate(submission.submittedAt) : 'Not submitted'}
                  </TableCell>
                  <TableCell>
                    {submission.grade !== null ? (
                      <span className={`font-medium ${
                        submission.grade >= 80 ? 'text-green-600' : 
                        submission.grade >= 60 ? 'text-yellow-600' : 
                        'text-red-600'
                      }`}>
                        {submission.grade}/100
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not graded</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                    
                      <Button 
                        size="sm" 
                        variant={submission.grade !== null ? "outline" : "default"}
                        onClick={() => openGradeDialog(submission)}
                      >
                        <FileText className="h-3.5 w-3.5 mr-1" /> 
                        {submission.grade !== null ? 'Update Grade' : 'Grade'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="bg-muted/50 p-4 text-center text-sm text-muted-foreground">
          <div className="flex justify-center items-center w-full">
            <Users className="h-4 w-4 mr-2" /> 
            Total of {assignment.totalStudents} students in this classroom
          </div>
        </CardFooter>
      </Card>

      {/* Separate Dialog component outside the table loop */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentSubmission?.grade !== null ? 'Update Grade' : 'Provide Grade'} for {currentSubmission?.student.firstName} {currentSubmission?.student.lastName}
            </DialogTitle>
            <DialogDescription>
              {currentSubmission?.status === 'COMPLETED' 
                ? 'Review and grade the submitted work'
                : 'Provide feedback even though work was not submitted'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="grade">
                Grade (0-100)
              </label>
              <Input
                id="grade"
                type="number"
                min="0"
                max="100"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="Enter grade"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="feedback">
                Feedback
              </label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide feedback to the student"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              onClick={handleSubmitGrade}
              disabled={currentSubmission && submitting[currentSubmission.id]}
            >
              {currentSubmission && submitting[currentSubmission.id] ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Grade'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}