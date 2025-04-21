'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, BookOpen, Clock, AlertTriangle, ArrowLeft, 
  UserPlus, FileText, Calendar, BarChart3 
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import axios from 'axios';

interface ClassroomDetail {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  createdAt: string;
  isActive: boolean;
  submissionCount: number;
  totalStudents: number;
}

export default function TeacherClassroomDetail() {
  const { user, token } = useAuth();
  const params = useParams();
  const classroomId = params.id as string;
  
  const [classroom, setClassroom] = useState<ClassroomDetail | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClassroomData = async () => {
      try {
        setLoading(true);
        
        // Fetch classroom details
        const classroomResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/teacher/classrooms/${classroomId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setClassroom(classroomResponse.data.classroom);
        
        // Fetch students in the classroom
        const studentsResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/teacher/classrooms/${classroomId}/students`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setStudents(studentsResponse.data.students);
        
        // Fetch assignments for the classroom
        const assignmentsResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/teacher/classrooms/${classroomId}/assignments`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setAssignments(assignmentsResponse.data.assignments);
        
        setLoading(false);
      } catch (err: any) {
        setError('Failed to load classroom data');
        setLoading(false);
        console.error('Error fetching classroom data:', err);
      }
    };

    fetchClassroomData();
  }, [classroomId, token]);

  // Format date to readable format
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="p-4">
        <div className="bg-red-50 text-red-800 p-4 rounded-md flex items-center mb-6">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <span>{error || 'Classroom not found'}</span>
        </div>
        <Button asChild>
          <Link href="/dashboard/teacher/classrooms">Back to Classrooms</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/teacher/classrooms">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{classroom.name}</h1>
      </div>
      
      <div className="text-muted-foreground">
        {classroom.description || 'No description available'}
      </div>
      
      
      <Tabs defaultValue="assignments" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="assignments" className="mt-6">
          {assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No assignments yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first assignment to get started.
              </p>
              <Button className="mt-4" asChild>
                <Link href={`/dashboard/teacher/classrooms/${classroomId}/assignments/new`}>
                  Create Assignment
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{assignment.title}</CardTitle>
                        <CardDescription>
                          {assignment.description || 'No description available'}
                        </CardDescription>
                      </div>
                      <div>
                        {!assignment.isActive && (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm mb-4">
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Due: {formatDate(assignment.dueDate)}</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Users className="h-4 w-4 mr-1" />
                        <span>
                          {assignment.submissionCount}/{assignment.totalStudents} submitted
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" asChild>
                        <Link href={`/dashboard/teacher/assignments/${assignment.id}`}>
                          View Submissions
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/teacher/assignments/${assignment.id}/edit`}>
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="students" className="mt-6">
          {students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No students enrolled</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Invite students to join your classroom.
              </p>
              <Button className="mt-4" asChild>
                <Link href={`/dashboard/teacher/classrooms/${classroomId}/invite`}>
                  Invite Students
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{student.firstName} {student.lastName}</td>
                      <td className="py-3 px-4">{student.email}</td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/dashboard/teacher/students/${student.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-6">
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Classroom Analytics</h3>
            <p className="text-sm text-muted-foreground mt-1">
              View detailed analytics in the Analytics page.
            </p>
            <Button className="mt-4" asChild>
              <Link href={`/dashboard/teacher/analytics?classroom=${classroomId}`}>
                View Full Analytics
              </Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}