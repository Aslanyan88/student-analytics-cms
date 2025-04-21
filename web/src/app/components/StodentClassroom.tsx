'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Users, 
  GraduationCap, 
  User,
  AlertTriangle, 
  Clock 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import axios from 'axios';

interface Classroom {
  id: string;
  name: string;
  description: string;
  activeAssignments: number;
}

interface ClassroomDetail {
  id: string;
  name: string;
  description: string;
  teachers: ClassroomMember[];
  students: ClassroomMember[];
  assignments: Assignment[];
}

interface ClassroomMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'TEACHER' | 'STUDENT';
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
}

export default function StudentClassroomPage() {
  const { user, token } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<ClassroomDetail | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch student's classrooms
  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/student/classrooms`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setClassrooms(response.data.classrooms);
        
        // If classrooms exist, select the first one by default
        if (response.data.classrooms.length > 0) {
          fetchClassroomDetails(response.data.classrooms[0].id);
        } else {
          setLoading(false);
        }
      } catch (err: any) {
        setError('Failed to load classrooms');
        setLoading(false);
        console.error('Error fetching classrooms:', err);
      }
    };

    if (token) {
      fetchClassrooms();
    }
  }, [token]);

  // Fetch classroom details including members
  const fetchClassroomDetails = async (classroomId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/student/classrooms/${classroomId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSelectedClassroom(response.data);
      setLoading(false);
    } catch (err: any) {
      setError('Failed to load classroom details');
      setLoading(false);
      console.error('Error fetching classroom details:', err);
    }
  };

  // Get initials from name
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Format due date
  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Check if date is past due
  const isPastDue = (dateString: string) => {
    const dueDate = new Date(dateString);
    const today = new Date();
    return dueDate < today;
  };

  if (loading && !selectedClassroom) {
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
        <h1 className="text-2xl font-bold">My Classrooms</h1>
      </div>

      {classrooms.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-medium text-gray-600">No Classrooms</h2>
          <p className="text-gray-500 mt-2">You're not enrolled in any classrooms yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <div className="flex overflow-x-auto pb-4 -mx-4 px-4 space-x-4">
            {classrooms.map((classroom) => (
              <Card 
                key={classroom.id} 
                className={`flex-shrink-0 w-64 cursor-pointer hover:border-blue-400 transition-colors ${selectedClassroom?.id === classroom.id ? 'border-blue-500' : ''}`}
                onClick={() => fetchClassroomDetails(classroom.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{classroom.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-2">{classroom.description || 'No description'}</p>
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{classroom.activeAssignments || 0} active assignments</span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

          {selectedClassroom && (
            <div>
              <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="members">Members</TabsTrigger>
                  <TabsTrigger value="assignments">Assignments</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>{selectedClassroom.name}</CardTitle>
                      <CardDescription>Classroom Information</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium text-gray-700">Description</h3>
                          <p className="mt-1 text-gray-600">{selectedClassroom.description || 'No description available'}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <GraduationCap className="h-5 w-5 text-blue-500" />
                              <h3 className="font-medium">Teachers</h3>
                            </div>
                            <p className="text-2xl font-bold">{selectedClassroom.teachers.length}</p>
                          </div>
                          
                          <div className="bg-green-50 p-4 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <Users className="h-5 w-5 text-green-500" />
                              <h3 className="font-medium">Students</h3>
                            </div>
                            <p className="text-2xl font-bold">{selectedClassroom.students.length}</p>
                          </div>
                          
                          <div className="bg-amber-50 p-4 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <BookOpen className="h-5 w-5 text-amber-500" />
                              <h3 className="font-medium">Assignments</h3>
                            </div>
                            <p className="text-2xl font-bold">{selectedClassroom.assignments.length}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="members" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <GraduationCap className="h-5 w-5 mr-2" />
                        Teachers
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedClassroom.teachers.length === 0 ? (
                          <p className="text-gray-500">No teachers assigned to this classroom.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {selectedClassroom.teachers.map((teacher) => (
                              <div key={teacher.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                                <Avatar>
                                  <AvatarFallback>{getInitials(teacher.firstName, teacher.lastName)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{teacher.firstName} {teacher.lastName}</p>
                                  <p className="text-sm text-gray-500">{teacher.email}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Users className="h-5 w-5 mr-2" />
                        Students
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedClassroom.students.length === 0 ? (
                          <p className="text-gray-500">No other students enrolled in this classroom.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {selectedClassroom.students.map((student) => (
                              <div key={student.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                                <Avatar>
                                  <AvatarFallback>{getInitials(student.firstName, student.lastName)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center">
                                    <p className="font-medium">{student.firstName} {student.lastName}</p>
                                    {student.id === user?.id && (
                                      <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-100">You</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-500">{student.email}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="assignments" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BookOpen className="h-5 w-5 mr-2" />
                        Assignments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedClassroom.assignments.length === 0 ? (
                          <p className="text-gray-500">No assignments in this classroom.</p>
                        ) : (
                          <div className="divide-y">
                            {selectedClassroom.assignments.map((assignment) => (
                              <div key={assignment.id} className="py-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h3 className="font-medium">{assignment.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                                  </div>
                                  {assignment.status === 'COMPLETED' ? (
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
                                  ) : isPastDue(assignment.dueDate) ? (
                                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>
                                  ) : (
                                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Due {formatDueDate(assignment.dueDate)}</Badge>
                                  )}
                                </div>
                                <div className="flex justify-end mt-2">
                                  <Button size="sm">View Details</Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      )}
    </div>
  );
}