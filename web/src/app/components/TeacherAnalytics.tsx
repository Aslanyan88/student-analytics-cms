'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, PieChart, LineChart, AlertTriangle, Download, Calendar, Users } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import React components for visualizations
import {
  Bar,
  BarChart as RechartsBarChart,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart as RechartsPieChart,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface Classroom {
  id: string;
  name: string;
}

interface AnalyticsData {
  attendanceData: {
    dates: string[];
    presentPercentages: number[];
    averageAttendance: number;
  };
  assignmentData: {
    assignmentCompletionRate: number;
    assignmentsByStatus: {
      name: string;
      value: number;
    }[];
    assignmentScores: {
      name: string;
      average: number;
    }[];
  };
  studentPerformance: {
    highPerformers: number;
    averagePerformers: number;
    lowPerformers: number;
    studentScores: {
      name: string;
      score: number;
    }[];
  };
}

export default function TeacherAnalytics() {
  const { user, token } = useAuth();
  const searchParams = useSearchParams();
  const classroomIdFromUrl = searchParams.get('classroom');
  
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string | null>(classroomIdFromUrl);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('month'); // week, month, semester, year

  // Fetch classrooms on component mount
  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        setLoading(true);
        
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/teacher/classrooms`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setClassrooms(response.data.classrooms);
        
        if (!classroomIdFromUrl && response.data.classrooms.length > 0) {
          setSelectedClassroom(response.data.classrooms[0].id);
        }
        
        setLoading(false);
      } catch (err: any) {
        setError('Failed to load classrooms');
        setLoading(false);
        console.error('Error fetching classrooms:', err);
      }
    };

    fetchClassrooms();
  }, [token, classroomIdFromUrl]);

  // Fetch analytics data when classroom or time range changes
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!selectedClassroom) return;
      
      try {
        setLoading(true);
        
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/teacher/analytics/${selectedClassroom}?timeRange=${timeRange}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setAnalyticsData(response.data);
        setLoading(false);
      } catch (err: any) {
        setError('Failed to load analytics data');
        setLoading(false);
        console.error('Error fetching analytics data:', err);
      }
    };

    fetchAnalyticsData();
  }, [selectedClassroom, timeRange, token]);

  // Generate colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Export data to CSV
  const exportAnalyticsToCSV = () => {
    if (!analyticsData || !selectedClassroom) return;
    
    const classroomName = classrooms.find(c => c.id === selectedClassroom)?.name || 'Classroom';
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Attendance Data
    csvContent += `Attendance Data - ${classroomName} - ${timeRange}\n`;
    csvContent += "Date,Attendance Percentage\n";
    analyticsData.attendanceData.dates.forEach((date, index) => {
      csvContent += `${date},${analyticsData.attendanceData.presentPercentages[index]}\n`;
    });
    
    csvContent += "\nAssignment Completion by Status\n";
    csvContent += "Status,Count\n";
    analyticsData.assignmentData.assignmentsByStatus.forEach(item => {
      csvContent += `${item.name},${item.value}\n`;
    });
    
    csvContent += "\nAverage Assignment Scores\n";
    csvContent += "Assignment,Average Score\n";
    analyticsData.assignmentData.assignmentScores.forEach(item => {
      csvContent += `${item.name},${item.average}\n`;
    });
    
    csvContent += "\nStudent Performance\n";
    csvContent += "Student,Score\n";
    analyticsData.studentPerformance.studentScores.forEach(item => {
      csvContent += `${item.name},${item.score}\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${classroomName}-analytics-${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !analyticsData) {
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

  // Mock data for visualization if real data isn't available yet
  const mockAttendanceData = [
    { date: 'Mon', attendance: 85 },
    { date: 'Tue', attendance: 90 },
    { date: 'Wed', attendance: 78 },
    { date: 'Thu', attendance: 92 },
    { date: 'Fri', attendance: 88 }
  ];

  const mockAssignmentStatusData = [
    { name: 'Completed', value: 63 },
    { name: 'In Progress', value: 28 },
    { name: 'Late', value: 8 },
    { name: 'Missing', value: 4 }
  ];

  const mockAssignmentScores = [
    { name: 'Assignment 1', average: 82 },
    { name: 'Assignment 2', average: 79 },
    { name: 'Assignment 3', average: 85 },
    { name: 'Assignment 4', average: 88 },
    { name: 'Assignment 5', average: 76 }
  ];

  const mockStudentScores = [
    { name: 'Student 1', score: 92 },
    { name: 'Student 2', score: 78 },
    { name: 'Student 3', score: 85 },
    { name: 'Student 4', score: 67 },
    { name: 'Student 5', score: 95 },
    { name: 'Student 6', score: 73 },
    { name: 'Student 7', score: 81 },
    { name: 'Student 8', score: 88 }
  ];

  // Use real data when available, otherwise use mock data
  const attendanceChartData = analyticsData
    ? analyticsData.attendanceData.dates.map((date, index) => ({
        date,
        attendance: analyticsData.attendanceData.presentPercentages[index]
      }))
    : mockAttendanceData;

  const assignmentStatusData = analyticsData
    ? analyticsData.assignmentData.assignmentsByStatus
    : mockAssignmentStatusData;

  const assignmentScoreData = analyticsData
    ? analyticsData.assignmentData.assignmentScores.map(item => ({
        name: item.name,
        average: item.average
      }))
    : mockAssignmentScores;

  const studentPerformanceData = analyticsData
    ? analyticsData.studentPerformance.studentScores
    : mockStudentScores;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Classroom Analytics</h1>
        <div className="flex space-x-2">
          <Button onClick={exportAnalyticsToCSV} disabled={!analyticsData}>
            <Download className="h-4 w-4 mr-2" /> Export Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Select Classroom</label>
          <Select 
            value={selectedClassroom || ''} 
            onValueChange={value => setSelectedClassroom(value)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a classroom" />
            </SelectTrigger>
            <SelectContent>
              {classrooms.map(classroom => (
                <SelectItem key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block">Time Range</label>
          <Select value={timeRange} onValueChange={setTimeRange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="semester">This Semester</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {analyticsData.attendanceData.averageAttendance}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Over the selected time period
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Assignment Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {analyticsData.assignmentData.assignmentCompletionRate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Overall completion rate
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Student Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <div>
                  <div className="flex items-center space-x-1">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <span className="text-xs">{analyticsData.studentPerformance.highPerformers} High</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center space-x-1">
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <span className="text-xs">{analyticsData.studentPerformance.averagePerformers} Avg</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center space-x-1">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <span className="text-xs">{analyticsData.studentPerformance.lowPerformers} Low</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="students">Student Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="attendance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Trends</CardTitle>
              <CardDescription>
                Attendance percentage over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart
                    data={attendanceChartData}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="attendance"
                      name="Attendance %"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center mt-4 space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Daily attendance percentages for the selected time period
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="assignments" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Status Distribution</CardTitle>
              <CardDescription>
                Overview of assignment completion status
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="h-80 w-full max-w-md">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={assignmentStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {assignmentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} assignments`, 'Count']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Average Assignment Scores</CardTitle>
              <CardDescription>
                Performance across different assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={assignmentScoreData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="average" name="Average Score" fill="#82ca9d" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="students" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Performance</CardTitle>
              <CardDescription>
                Individual student scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={studentPerformanceData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="score" name="Overall Score">
                      {studentPerformanceData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.score >= 80 ? '#4ade80' : // High performer
                            entry.score >= 60 ? '#facc15' : // Average performer
                            '#f87171' // Low performer
                          } 
                        />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center mt-4 space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Performance is calculated based on assignment submissions and attendance
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}