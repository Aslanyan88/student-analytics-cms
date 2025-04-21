'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, Calendar, BarChart2, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { differenceInDays } from 'date-fns';

interface StudentStats {
  totalClassrooms: number;
  activeAssignments: number;
  completedAssignments: number;
  overdueAssignments: number;
}

interface UpcomingAssignment {
  id: string;
  title: string;
  dueDate: string;
  classroomName: string;
}

interface ClassPerformance {
  classroomId: string;
  classroomName: string;
  performance: number;
}

interface ClassSchedule {
  id: string;
  name: string;
  teacher: string;
  startTime: string;
  endTime: string;
}

export default function StudentDashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<StudentStats>({
    totalClassrooms: 0,
    activeAssignments: 0,
    completedAssignments: 0,
    overdueAssignments: 0
  });
  const [upcomingAssignments, setUpcomingAssignments] = useState<UpcomingAssignment[]>([]);
  const [classPerformance, setClassPerformance] = useState<ClassPerformance[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch student dashboard data
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch dashboard stats from backend
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/student/dashboard-stats`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Set dashboard stats
        setStats({
          totalClassrooms: response.data.totalClassrooms || 0,
          activeAssignments: response.data.activeAssignments || 0,
          completedAssignments: response.data.completedAssignments || 0,
          overdueAssignments: response.data.overdueAssignments || 0
        });
        
        // Set upcoming assignments
        setUpcomingAssignments(response.data.upcomingAssignments || []);
        
        // Fetch classrooms for performance data
        const classroomsResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/student/classrooms`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Fetch assignments for calculating class performance
        const assignmentsResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/student/assignments`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Calculate performance per classroom
        const classrooms = classroomsResponse.data.classrooms || [];
        const assignments = assignmentsResponse.data.assignments || [];
        
        // Group assignments by classroom
        const assignmentsByClassroom = assignments.reduce((acc, assignment) => {
          const classroomId = assignment.classroom.id;
          if (!acc[classroomId]) {
            acc[classroomId] = [];
          }
          acc[classroomId].push(assignment);
          return acc;
        }, {});
        
        // Calculate average performance for each classroom
        const performance = classrooms.map(classroom => {
          const classroomAssignments = assignmentsByClassroom[classroom.id] || [];
          const gradedAssignments = classroomAssignments.filter(a => a.grade !== null);
          
          let avgPerformance = 0;
          if (gradedAssignments.length > 0) {
            avgPerformance = gradedAssignments.reduce((sum, a) => sum + (a.grade || 0), 0) / gradedAssignments.length;
          }
          
          return {
            classroomId: classroom.id,
            classroomName: classroom.name,
            performance: Math.round(avgPerformance)
          };
        });
        
        // Sort by performance (highest first) and take top 5
        const topPerformance = performance
          .sort((a, b) => b.performance - a.performance)
          .slice(0, 5);
        
        setClassPerformance(topPerformance);
        
        // For today's schedule, we'll use the classroom data (ideally this would come from a schedule API)
        // This is a simplified example since we don't have actual schedule data
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Mock schedule based on classrooms (in a real app, this would come from the backend)
        if (classrooms.length > 0) {
          // Create a deterministic schedule based on classroom IDs
          const schedule = classrooms.map((classroom, index) => {
            // Create a deterministic start time based on classroom ID and day of week
            const hour = 8 + (index % 5); // Classes start from 8 AM
            const startTime = `${hour}:00 AM`;
            const endTime = `${hour + 1}:30 AM`;
            
            return {
              id: classroom.id,
              name: classroom.name,
              teacher: 'Prof. ' + user?.lastName || 'Smith', // We don't have teacher data here
              startTime,
              endTime
            };
          });
          
          setTodaySchedule(schedule.slice(0, 3)); // Show up to 3 classes
        }
        
        setLoading(false);
      } catch (err: any) {
        setError('Failed to load student dashboard data');
        setLoading(false);
        console.error('Error fetching student data:', err);
      }
    };

    if (token) {
      fetchStudentData();
    }
  }, [token, user]);

  // Calculate days left until due date
  const getDaysLeft = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    return differenceInDays(due, today);
  };

  // Get color class based on performance score
  const getPerformanceColorClass = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 80) return "bg-green-500";
    if (score >= 70) return "bg-yellow-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
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

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate average performance across all classes
  const overallPerformance = classPerformance.length > 0 
    ? Math.round(classPerformance.reduce((sum, c) => sum + c.performance, 0) / classPerformance.length)
    : 0;

  // If no classes, show empty state
  if (stats.totalClassrooms === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Hi, {user?.firstName}!</h1>
          <p className="text-muted-foreground">{today}</p>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Classes Enrolled</h2>
            <p className="text-muted-foreground text-center mb-6">
              You are not enrolled in any classes yet. Contact your administrator to get started.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hi, {user?.firstName}!</h1>
        <p className="text-muted-foreground">{today}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClassrooms}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Enrolled classes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAssignments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending assignments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallPerformance}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Overall score across classes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedAssignments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Assignments submitted
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Assignments</CardTitle>
            <CardDescription>
              Assignments due soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAssignments.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No upcoming assignments
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAssignments.map((assignment) => {
                  const daysLeft = getDaysLeft(assignment.dueDate);
                  return (
                    <div key={assignment.id} className="flex justify-between items-center border-b pb-3">
                      <div>
                        <p className="font-medium">{assignment.title}</p>
                        <p className="text-sm text-muted-foreground">{assignment.classroomName}</p>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded ${
                        daysLeft < 0 
                          ? 'bg-red-100 text-red-800' 
                          : daysLeft <= 3 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-blue-100 text-blue-800'
                      }`}>
                        {daysLeft < 0
                          ? 'Overdue'
                          : `Due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <Button variant="link" size="sm" className="mt-4 px-0" asChild>
              <Link href="/dashboard/student/assignments">
                View all assignments
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>
              Your academic progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            {classPerformance.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No performance data available yet
              </div>
            ) : (
              <div className="space-y-4">
                {classPerformance.map((classroom) => (
                  <div key={classroom.classroomId}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{classroom.classroomName}</span>
                      <span className="text-sm font-medium">{classroom.performance}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${getPerformanceColorClass(classroom.performance)} h-2 rounded-full`} 
                        style={{ width: `${classroom.performance}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Class Schedule Today</CardTitle>
          <CardDescription>
            Your classes for today
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todaySchedule.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No classes scheduled for today
            </div>
          ) : (
            <div className="space-y-4">
              {todaySchedule.map((classItem, index) => {
                // Choose a different color for each class
                const colors = ['blue', 'green', 'purple', 'orange', 'pink'];
                const colorIndex = index % colors.length;
                const colorClass = `bg-${colors[colorIndex]}-100 text-${colors[colorIndex]}-800`;
                
                return (
                  <div key={classItem.id} className="flex justify-between items-center border-b pb-3">
                    <div className="flex items-center">
                      <div className={`${colorIndex === 0 ? 'bg-blue-100 text-blue-800' : 
                                          colorIndex === 1 ? 'bg-green-100 text-green-800' : 
                                          'bg-purple-100 text-purple-800'} rounded-lg p-3 mr-4`}>
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-medium">{classItem.name}</p>
                        <p className="text-sm text-muted-foreground">{classItem.teacher}</p>
                      </div>
                    </div>
                    <div className="text-sm">{classItem.startTime} - {classItem.endTime}</div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}