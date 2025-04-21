'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../../../contexts/AuthContext';
import { ArrowLeft, Download, Clock, User, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Submission {
  id: string;
  status: string;
  submittedAt: string | null;
  grade: number | null;
  feedback: string | null;
  submissionContent: string | null;
  fileUrl: string | null;
  student: Student;
  assignment: {
    id: string;
    title: string;
    dueDate: string | null;
    classroom: {
      id: string;
      name: string;
    }
  };
}

export default function SubmissionDetail() {
  const { user, token } = useAuth();
  const params = useParams();
  const submissionId = params.id as string;
  
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grade, setGrade] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Please log in to view this page');
      setLoading(false);
      return;
    }

    const fetchSubmissionDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/teacher/submissions/${submissionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSubmission(response.data.submission);
        setGrade(response.data.submission.grade !== null ? response.data.submission.grade.toString() : '');
        setFeedback(response.data.submission.feedback || '');
        setLoading(false);
      } catch (err: any) {
        if (err.response && err.response.status === 401) {
          setError('Session expired. Please log in again.');
        } else {
          setError('Failed to load submission details');
        }
        setLoading(false);
        console.error('Error fetching submission details:', err);
      }
    };

    fetchSubmissionDetails();
  }, [submissionId, token]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return format(date, 'MMMM d, yyyy h:mm a');
  };

  const handleSubmitGrade = async () => {
    if (!submission || !token) return;
    
    try {
      setSubmitting(true);
      setSaved(false);
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/teacher/submissions/${submission.id}`,
        { grade: grade ? parseFloat(grade) : null, feedback },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubmission({ ...submission, grade: grade ? parseFloat(grade) : null, feedback });
      setSubmitting(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error('Error updating submission:', err);
      setSubmitting(false);
    }
  };

  if (!user || !token) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg font-medium">Please log in to view this page</p>
          <Button asChild className="mt-4">
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="p-4">
        <div className="bg-red-50 text-red-800 p-4 rounded-md flex items-center mb-6">
          <span>{error || 'Submission not found'}</span>
        </div>
        <Button asChild>
          <Link href="/dashboard/teacher/assignments">Back to Assignments</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rest of your JSX remains unchanged */}
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/teacher/assignments/${submission.assignment.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Submission: {submission.assignment.title}</h1>
          <div className="text-muted-foreground text-sm mt-1">
            <Link href={`/dashboard/teacher/classrooms/${submission.assignment.classroom.id}`} className="hover:underline">
              {submission.assignment.classroom.name}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Student</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium flex items-center">
              <User className="h-4 w-4 mr-2 text-muted-foreground" />
              {submission.student.firstName} {submission.student.lastName}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {submission.student.email}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Submission Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium flex items-center">
              {submission.status === 'COMPLETED' ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Completed
                </Badge>
              ) : submission.status === 'OVERDUE' ? (
                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                  <AlertCircle className="h-4 w-4 mr-2" /> Overdue
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  <Clock className="h-4 w-4 mr-2" /> Pending
                </Badge>
              )}
            </div>
            {submission.submittedAt && (
              <div className="text-sm text-muted-foreground mt-1">
                Submitted on {formatDate(submission.submittedAt)}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Assignment Due Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              {formatDate(submission.assignment.dueDate)}
            </div>
          </CardContent>
        </Card>
      </div>

      {submission.status === 'COMPLETED' && (
        <Card>
          <CardHeader>
            <CardTitle>Submission Content</CardTitle>
          </CardHeader>
          <CardContent>
            {submission.submissionContent ? (
              <div className="prose max-w-none">
                <p>{submission.submissionContent}</p>
              </div>
            ) : submission.fileUrl ? (
              <div className="flex items-center justify-center p-6 border border-dashed rounded-md">
                <Button variant="outline" asChild>
                  <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" /> Download Submission File
                  </a>
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">No submission content available</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Grading</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
                rows={6}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {saved && (
            <div className="text-green-600 font-medium flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2" /> 
              Saved successfully
            </div>
          )}
          <Button 
            onClick={handleSubmitGrade}
            disabled={submitting}
            className="ml-auto"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              'Save Grade'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}