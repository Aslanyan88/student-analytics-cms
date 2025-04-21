'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Clock, CheckCircle, FileText, Calendar } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

// Update interface to match the backend response
interface Assignment {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: string;
  submittedAt: string | null;
  grade: number | null;
  feedback: string | null;
  classroom: {
    id: string;
    name: string;
  };
}

export default function StudentAssignmentsPage() {
  const { user, token } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        
        console.log('Fetching assignments with token:', token ? 'Token exists' : 'No token');
        
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/student/assignments`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log('API Response:', response.data);
        
        if (response.data && response.data.assignments) {
          setAssignments(response.data.assignments);
        } else {
          console.error('Unexpected response format:', response.data);
          setError('Invalid response format from server');
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching assignments:', err.response?.data || err.message || err);
        setError('Failed to load assignments: ' + (err.response?.data?.message || err.message || 'Unknown error'));
        setLoading(false);
      }
    };

    if (token) {
      fetchAssignments();
    } else {
      setError('Authentication token missing');
      setLoading(false);
    }
  }, [token]);

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

  // Filter assignments based on active tab
  const filteredAssignments = assignments.filter(assignment => {
    if (activeTab === 'pending') return assignment.status === 'PENDING';
    if (activeTab === 'completed') return assignment.status === 'COMPLETED';
    if (activeTab === 'overdue') return assignment.status === 'OVERDUE';
    return true; // all tab
  });

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 text-red-800 p-4 rounded-md flex items-center mb-6">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Assignments</h1>
        <div>
          <Button asChild variant="outline">
            <Link href="/dashboard/student">Back to Dashboard</Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pending" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {renderAssignmentList(filteredAssignments)}
        </TabsContent>
        
        <TabsContent value="pending" className="space-y-4">
          {renderAssignmentList(filteredAssignments)}
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4">
          {renderAssignmentList(filteredAssignments)}
        </TabsContent>
        
        <TabsContent value="overdue" className="space-y-4">
          {renderAssignmentList(filteredAssignments)}
        </TabsContent>
      </Tabs>
    </div>
  );

  function renderAssignmentList(assignments: Assignment[]) {
    if (assignments.length === 0) {
      return (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No assignments found in this category.</p>
        </div>
      );
    }

    return assignments.map((assignment) => (
      <Card key={assignment.id} className={isOverdue(assignment.dueDate) && assignment.status === 'PENDING' ? 'border-red-300' : ''}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{assignment.title}</CardTitle>
              <CardDescription>{assignment.classroom.name}</CardDescription>
            </div>
            <Badge className={getStatusColor(assignment.status)}>
              {assignment.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              {assignment.description?.substring(0, 150)}
              {assignment.description && assignment.description.length > 150 ? '...' : ''}
            </p>
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Due: {formatDate(assignment.dueDate)}</span>
            </div>
            {assignment.grade !== null && (
              <div className="flex items-center mt-2">
                <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  Grade: {assignment.grade}/100
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex justify-between w-full">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/student/assignments/${assignment.id}`}>
                <FileText className="h-4 w-4 mr-2" /> View Details
              </Link>
            </Button>
            {assignment.status === 'PENDING' && (
              <Button asChild>
                <Link href={`/dashboard/student/assignments/${assignment.id}/submit`}>
                  <CheckCircle className="h-4 w-4 mr-2" /> Submit Assignment
                </Link>
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    ));
  }
}