'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowLeft, Calendar, Clock, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

interface AssignmentDetail {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: string;
  submittedAt: string | null;
  grade: number | null;
  feedback: string | null;
  classroomName: string;
  creator: {
    id: string;
    name: string;
  };
}

export default function StudentAssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignmentDetail = async () => {
      try {
        setLoading(true);
        const assignmentId = params.id;
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/student/assignments/${assignmentId}`,
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

    if (params.id) {
      fetchAssignmentDetail();
    }
  }, [params.id, token]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const timeRemaining = (dueDate: string | null) => {
    if (!dueDate) return null;
    
    const due = new Date(dueDate);
    const now = new Date();
    
    if (due < now) {
      return 'Overdue';
    }
    
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} and ${diffHours} hour${diffHours !== 1 ? 's' : ''} remaining`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} remaining`;
    } else {
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} remaining`;
    }
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
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold">{assignment.title}</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">{assignment.title}</CardTitle>
              <CardDescription>
                <span className="font-medium">{assignment.classroomName}</span> • 
                <span className="ml-2">Assigned by {assignment.creator.name}</span>
              </CardDescription>
            </div>
            <Badge className={getStatusColor(assignment.status)}>
              {assignment.status}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Due Date</p>
                <p className="text-sm text-gray-600">{formatDate(assignment.dueDate)}</p>
              </div>
            </div>
            
            {assignment.dueDate && assignment.status === 'PENDING' && (
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-gray-500" /> 
                <div>
                  <p className="text-sm font-medium">Time Remaining</p>
                  <p className={`text-sm ${isOverdue(assignment.dueDate) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                    {timeRemaining(assignment.dueDate)}
                  </p>
                </div>
              </div>
            )}
            
            {assignment.submittedAt && (
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Submitted On</p>
                  <p className="text-sm text-gray-600">{formatDate(assignment.submittedAt)}</p>
                </div>
              </div>
            )}
            
            {assignment.grade !== null && (
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Grade</p>
                  <p className="text-sm">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {assignment.grade}/100
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Assignment Description</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              {assignment.description ? (
                <div className="prose max-w-none">
                  <p className="whitespace-pre-line">{assignment.description}</p>
                </div>
              ) : (
                <p className="text-gray-500">No description provided</p>
              )}
            </div>
          </div>
          
          {assignment.feedback && (
            <div>
              <h3 className="text-lg font-medium mb-2">Teacher Feedback</h3>
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="whitespace-pre-line">{assignment.feedback}</p>
              </div>
            </div>
          )}
          
          {isOverdue(assignment.dueDate) && assignment.status === 'PENDING' && (
            <div className="bg-red-50 p-4 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">This assignment is overdue</p>
                <p className="text-sm text-red-600">
                  Please submit as soon as possible or contact your teacher for an extension.
                </p>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          <div className="flex justify-end w-full">
            {assignment.status === 'PENDING' && (
              <Button asChild>
                <Link href={`/dashboard/student/assignments/${assignment.id}/submit`}>
                  <CheckCircle className="h-4 w-4 mr-2" /> Submit Assignment
                </Link>
              </Button>
            )}
            {assignment.status === 'COMPLETED' && !assignment.grade && (
              <div className="text-sm text-gray-500">
                Awaiting teacher feedback
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}