'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Download, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import axios from 'axios';

// Define interfaces for our data models
interface ClassroomStats {
  id: string;
  name: string;
  studentCount: number;
  assignmentCount: number;
  averageScore: number;
  attendanceRate: number;
}

interface StudentPerformance {
  id: string;
  name: string;
  averageScore: number;
  assignmentsCompleted: number;
  assignmentsPending: number;
  attendanceRate: number;
  trend: Array<{
    date: string;
    score: number;
  }>;
}

interface TeacherEffectiveness {
  id: string;
  name: string;
  classroomCount: number;
  studentCount: number;
  averageClassScore: number;
  classrooms: Array<{
    id: string;
    name: string;
    averageScore: number;
  }>;
}

export default function ReportsDashboard() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for filtered data
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  });
  
  // State for analytics data
  const [classrooms, setClassrooms] = useState<ClassroomStats[]>([]);
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformance[]>([]);
  const [teacherEffectiveness, setTeacherEffectiveness] = useState<TeacherEffectiveness[]>([]);

  useEffect(() => {
    // Mock data for development
    setMockData();
  }, [user, token, selectedClassroom]);

  // Set mock data for development
  const setMockData = () => {
    // Mock classroom stats
    setClassrooms([
      { id: '1', name: 'Mathematics 101', studentCount: 32, assignmentCount: 12, averageScore: 78, attendanceRate: 92 },
      { id: '2', name: 'Advanced Physics', studentCount: 24, assignmentCount: 10, averageScore: 82, attendanceRate: 88 },
      { id: '3', name: 'Computer Science', studentCount: 28, assignmentCount: 15, averageScore: 85, attendanceRate: 94 },
      { id: '4', name: 'Biology', studentCount: 30, assignmentCount: 11, averageScore: 76, attendanceRate: 90 }
    ]);
    
    // Mock student performance
    setStudentPerformance([
      {
        id: '1',
        name: 'John Smith',
        averageScore: 82,
        assignmentsCompleted: 10,
        assignmentsPending: 2,
        attendanceRate: 95,
        trend: Array.from({ length: 6 }, (_, i) => ({ date: `Week ${i+1}`, score: Math.round(Math.random() * 20 + 70) }))
      },
      {
        id: '2',
        name: 'Emily Johnson',
        averageScore: 88,
        assignmentsCompleted: 12,
        assignmentsPending: 0,
        attendanceRate: 98,
        trend: Array.from({ length: 6 }, (_, i) => ({ date: `Week ${i+1}`, score: Math.round(Math.random() * 20 + 70) }))
      },
      {
        id: '3',
        name: 'Michael Brown',
        averageScore: 75,
        assignmentsCompleted: 9,
        assignmentsPending: 3,
        attendanceRate: 90,
        trend: Array.from({ length: 6 }, (_, i) => ({ date: `Week ${i+1}`, score: Math.round(Math.random() * 20 + 70) }))
      }
    ]);
    
    // Mock teacher effectiveness
    setTeacherEffectiveness([
      {
        id: '1',
        name: 'Dr. Robert Wilson',
        classroomCount: 3,
        studentCount: 84,
        averageClassScore: 81,
        classrooms: [
          { id: '1', name: 'Mathematics 101', averageScore: 78 },
          { id: '2', name: 'Advanced Algebra', averageScore: 82 },
          { id: '3', name: 'Calculus', averageScore: 83 }
        ]
      },
      {
        id: '2',
        name: 'Prof. Sarah Martinez',
        classroomCount: 2,
        studentCount: 52,
        averageClassScore: 85,
        classrooms: [
          { id: '4', name: 'Physics', averageScore: 84 },
          { id: '5', name: 'Computer Science', averageScore: 86 }
        ]
      }
    ]);
    
    setLoading(false);
  };

  // Handle exporting reports to CSV
// Handle exporting reports to CSV
const handleExportReport = () => {
  // Determine which data to export based on active tab
  let dataToExport = [];
  let filename = 'report.csv';
  
  switch (activeTab) {
    case 'overview':
      // For overview, export a summary of all data
      dataToExport = classrooms.map(classroom => ({
        Type: 'Classroom',
        Name: classroom.name,
        'Student Count': classroom.studentCount,
        'Assignment Count': classroom.assignmentCount,
        'Average Score': classroom.averageScore,
        'Attendance Rate': classroom.attendanceRate
      }));
      filename = 'overview_report.csv';
      break;
      
    case 'students':
      // Export student performance data
      dataToExport = studentPerformance.map(student => ({
        Name: student.name,
        'Average Score': student.averageScore,
        'Assignments Completed': student.assignmentsCompleted,
        'Assignments Pending': student.assignmentsPending,
        'Attendance Rate': student.attendanceRate,
        'Completion Rate': Math.round((student.assignmentsCompleted / 
          (student.assignmentsCompleted + student.assignmentsPending)) * 100) + '%'
      }));
      filename = 'student_performance_report.csv';
      break;
      
    case 'teachers':
      // Export teacher effectiveness data
      dataToExport = teacherEffectiveness.map(teacher => ({
        Name: teacher.name,
        'Classroom Count': teacher.classroomCount,
        'Student Count': teacher.studentCount,
        'Average Class Score': teacher.averageClassScore
      }));
      filename = 'teacher_effectiveness_report.csv';
      break;
      
    case 'classrooms':
      // Export classroom analytics data
      dataToExport = classrooms.map(classroom => ({
        Name: classroom.name,
        'Student Count': classroom.studentCount,
        'Assignment Count': classroom.assignmentCount,
        'Average Score': classroom.averageScore,
        'Attendance Rate': classroom.attendanceRate
      }));
      filename = 'classroom_analytics_report.csv';
      break;
      
    case 'assignments':
      // This would be expanded when assignment data is available
      dataToExport = [{ Note: 'Assignment data will be available in future updates' }];
      filename = 'assignment_report.csv';
      break;
  }
  
  // Add classroom filter information if applicable
  if (selectedClassroom !== 'all') {
    const classroomName = classrooms.find(c => c.id === selectedClassroom)?.name || 'Unknown';
    filename = `${classroomName}_${filename}`;
  }
  
  // Add date range to filename
  const fromDate = selectedDateRange.from.toISOString().split('T')[0];
  const toDate = selectedDateRange.to.toISOString().split('T')[0];
  filename = `${filename.replace('.csv', '')}_${fromDate}_to_${toDate}.csv`;
  
  // Validate that we have data to export
  if (!Array.isArray(dataToExport) || dataToExport.length === 0) {
    alert('No data available to export');
    return;
  }
  
  try {
    // Extract headers from the first data object
    const headers = Object.keys(dataToExport[0]);
    
    // Create CSV header row
    const csvRows = [headers.join(',')];
    
    // Add data rows
    for (const row of dataToExport) {
      const values = headers.map(header => {
        // Handle values that need escaping (commas, quotes, etc.)
        const cellValue = row[header] === null || row[header] === undefined ? '' : row[header];
        const escaped = ('' + cellValue).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    
    // Combine rows into a CSV string
    const csvContent = csvRows.join('\n');
    
    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const link = document.createElement('a');
    
    // Create object URL for the Blob
    const url = URL.createObjectURL(blob);
    
    // Set link attributes
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    // Add link to DOM, trigger download, and clean up
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`Export successful: ${filename}`);
  } catch (error) {
    console.error('Export failed:', error);
    alert('Failed to export report. See console for details.');
  }
};

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Analytics & Reports</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-[250px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
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

  // Create progress bar component for visual representation
  const ProgressBar = ({ value, max = 100, color = "bg-blue-500" }) => (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div 
        className={`${color} h-2.5 rounded-full`} 
        style={{ width: `${(value / max) * 100}%` }}
      ></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics & Reports</h1>
          <p className="text-muted-foreground">
            View performance metrics and insights for your institution
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" /> Export Report
          </Button>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {selectedDateRange.from.toLocaleDateString()} - {selectedDateRange.to.toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="w-full max-w-xs">
          <Select
            value={selectedClassroom}
            onValueChange={setSelectedClassroom}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Classroom" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classrooms</SelectItem>
              {classrooms.map(classroom => (
                <SelectItem key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 md:grid-cols-5 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="classrooms">Classrooms</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Summary</CardTitle>
                <CardDescription>Key metrics at a glance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Overall Average Score</span>
                      <span className="text-sm font-medium">81%</span>
                    </div>
                    <ProgressBar value={81} color="bg-blue-500" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Average Attendance</span>
                      <span className="text-sm font-medium">92%</span>
                    </div>
                    <ProgressBar value={92} color="bg-green-500" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Assignment Completion</span>
                      <span className="text-sm font-medium">88%</span>
                    </div>
                    <ProgressBar value={88} color="bg-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Class Distribution</CardTitle>
                <CardDescription>Students per classroom</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {classrooms.map(classroom => (
                    <div key={classroom.id}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{classroom.name}</span>
                        <span className="text-sm font-medium">{classroom.studentCount} students</span>
                      </div>
                      <ProgressBar 
                        value={classroom.studentCount} 
                        max={35} 
                        color="bg-indigo-500" 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Statistics</CardTitle>
                <CardDescription>Important numbers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">Total Students</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {classrooms.reduce((sum, c) => sum + c.studentCount, 0)}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-800">Total Classes</p>
                    <p className="text-2xl font-bold text-green-800">{classrooms.length}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-800">Teachers</p>
                    <p className="text-2xl font-bold text-purple-800">{teacherEffectiveness.length}</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <p className="text-sm text-amber-800">Assignments</p>
                    <p className="text-2xl font-bold text-amber-800">
                      {classrooms.reduce((sum, c) => sum + c.assignmentCount, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Performing Classrooms</CardTitle>
                <CardDescription>By average score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {classrooms
                    .sort((a, b) => b.averageScore - a.averageScore)
                    .slice(0, 5)
                    .map((classroom, index) => (
                      <div key={classroom.id} className="flex items-center justify-between pb-2 border-b">
                        <div>
                          <p className="font-medium">{classroom.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {classroom.studentCount} students, {classroom.assignmentCount} assignments
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{classroom.averageScore}%</p>
                          <p className="text-sm text-muted-foreground">
                            Attendance: {classroom.attendanceRate}%
                          </p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Performing Students</CardTitle>
                <CardDescription>By average score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {studentPerformance
                    .sort((a, b) => b.averageScore - a.averageScore)
                    .slice(0, 5)
                    .map((student, index) => (
                      <div key={student.id} className="flex items-center justify-between pb-2 border-b">
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {student.assignmentsCompleted} completed, {student.assignmentsPending} pending
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{student.averageScore}%</p>
                          <p className="text-sm text-muted-foreground">
                            Attendance: {student.attendanceRate}%
                          </p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Performance</CardTitle>
              <CardDescription>
                Detailed view of student performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {studentPerformance.map(student => (
                  <div key={student.id} className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold">{student.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Assignments: {student.assignmentsCompleted} completed, {student.assignmentsPending} pending
                        </p>
                      </div>
                      <div className="mt-2 md:mt-0 md:text-right">
                        <div className="text-2xl font-bold">{student.averageScore}%</div>
                        <p className="text-sm text-muted-foreground">
                          Average Score
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Average Score</span>
                          <span className="text-sm font-medium">{student.averageScore}%</span>
                        </div>
                        <ProgressBar 
                          value={student.averageScore} 
                          color={student.averageScore > 80 ? "bg-green-500" : 
                                 student.averageScore > 60 ? "bg-yellow-500" : "bg-red-500"} 
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Attendance</span>
                          <span className="text-sm font-medium">{student.attendanceRate}%</span>
                        </div>
                        <ProgressBar 
                          value={student.attendanceRate} 
                          color="bg-blue-500" 
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Assignment Completion</span>
                          <span className="text-sm font-medium">
                            {Math.round((student.assignmentsCompleted / 
                              (student.assignmentsCompleted + student.assignmentsPending)) * 100)}%
                          </span>
                        </div>
                        <ProgressBar 
                          value={student.assignmentsCompleted} 
                          max={student.assignmentsCompleted + student.assignmentsPending} 
                          color="bg-purple-500" 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teachers Tab */}
        <TabsContent value="teachers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Effectiveness</CardTitle>
              <CardDescription>
                Analysis of teacher performance across classrooms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {teacherEffectiveness.map(teacher => (
                  <div key={teacher.id} className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold">{teacher.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {teacher.classroomCount} classrooms, {teacher.studentCount} students
                        </p>
                      </div>
                      <div className="mt-2 md:mt-0 md:text-right">
                        <div className="text-2xl font-bold">{teacher.averageClassScore}%</div>
                        <p className="text-sm text-muted-foreground">
                          Average Score Across Classes
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {teacher.classrooms.map(classroom => (
                        <div key={classroom.id}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{classroom.name}</span>
                            <span className="text-sm font-medium">{classroom.averageScore}%</span>
                          </div>
                          <ProgressBar 
                            value={classroom.averageScore} 
                            color={classroom.averageScore > 80 ? "bg-green-500" : 
                                   classroom.averageScore > 60 ? "bg-yellow-500" : "bg-red-500"} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Classrooms Tab */}
        <TabsContent value="classrooms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Classroom Analytics</CardTitle>
              <CardDescription>
                Detailed performance metrics by classroom
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {classrooms.map(classroom => (
                  <div key={classroom.id} className="border rounded-lg p-4">
                    <h3 className="text-lg font-bold mb-2">{classroom.name}</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-blue-50 p-2 rounded">
                          <p className="text-xs text-blue-800">Students</p>
                          <p className="text-xl font-bold text-blue-800">{classroom.studentCount}</p>
                        </div>
                        <div className="bg-purple-50 p-2 rounded">
                          <p className="text-xs text-purple-800">Assignments</p>
                          <p className="text-xl font-bold text-purple-800">{classroom.assignmentCount}</p>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Average Score</span>
                          <span className="text-sm font-medium">{classroom.averageScore}%</span>
                        </div>
                        <ProgressBar 
                          value={classroom.averageScore} 
                          color={classroom.averageScore > 80 ? "bg-green-500" : 
                                 classroom.averageScore > 60 ? "bg-yellow-500" : "bg-red-500"} 
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Attendance Rate</span>
                          <span className="text-sm font-medium">{classroom.attendanceRate}%</span>
                        </div>
                        <ProgressBar 
                          value={classroom.attendanceRate} 
                          color="bg-blue-500" 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Analytics</CardTitle>
              <CardDescription>
                Performance data for assignments across classrooms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-8 text-center">
                <h3 className="text-lg font-medium text-muted-foreground">
                  Assignment analytics will be implemented in a future update.
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  This section will include detailed analytics on assignment completion rates, 
                  average scores, and time-to-completion metrics.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}