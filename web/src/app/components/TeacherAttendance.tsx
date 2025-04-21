'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, CheckCircle2, XCircle, AlertTriangle, ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { format, addDays, subDays } from 'date-fns';

interface Classroom {
  id: string;
  name: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isPresent?: boolean; // For today's attendance
}

interface AttendanceRecord {
  id: string;
  date: string;
  studentId: string;
  isPresent: boolean;
}

export default function TeacherAttendance() {
  const { user, token } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
        
        if (response.data.classrooms.length > 0) {
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
  }, [token]);

  // Fetch students and attendance records when classroom or date changes
  useEffect(() => {
    const fetchAttendanceData = async () => {
      if (!selectedClassroom) return;
      
      try {
        setLoading(true);
        
        // Fetch students in the classroom
        const studentsResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/teacher/classrooms/${selectedClassroom}/students`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Fetch attendance records for selected date
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        const attendanceResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/teacher/attendance/${selectedClassroom}?date=${dateString}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setStudents(studentsResponse.data.students);
        setAttendanceRecords(attendanceResponse.data.attendanceRecords);
        
        // Merge attendance records with students
        const studentsWithAttendance = studentsResponse.data.students.map((student: Student) => {
          const attendanceRecord = attendanceResponse.data.attendanceRecords.find(
            (record: AttendanceRecord) => record.studentId === student.id
          );
          
          return {
            ...student,
            isPresent: attendanceRecord ? attendanceRecord.isPresent : true
          };
        });
        
        setStudents(studentsWithAttendance);
        setLoading(false);
      } catch (err: any) {
        setError('Failed to load attendance data');
        setLoading(false);
        console.error('Error fetching attendance data:', err);
      }
    };

    fetchAttendanceData();
  }, [selectedClassroom, selectedDate, token]);

  const handlePreviousDay = () => {
    setSelectedDate(previous => subDays(previous, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(previous => addDays(previous, 1));
  };

  const handleAttendanceChange = (studentId: string, isPresent: boolean) => {
    setStudents(students.map(student => 
      student.id === studentId 
        ? { ...student, isPresent } 
        : student
    ));
  };

  const handleSubmitAttendance = async () => {
    if (!selectedClassroom) return;
    
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const attendanceData = students.map(student => ({
        studentId: student.id,
        isPresent: student.isPresent === undefined ? true : student.isPresent
      }));
      
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/teacher/attendance/${selectedClassroom}`,
        {
          date: dateString,
          attendanceRecords: attendanceData
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess('Attendance submitted successfully');
      setSubmitting(false);
    } catch (err: any) {
      setError('Failed to submit attendance');
      setSubmitting(false);
      console.error('Error submitting attendance:', err);
    }
  };

  const markAllPresent = () => {
    setStudents(students.map(student => ({ ...student, isPresent: true })));
  };

  const markAllAbsent = () => {
    setStudents(students.map(student => ({ ...student, isPresent: false })));
  };

  if (loading && !selectedClassroom) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Attendance Tracking</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Take Attendance</CardTitle>
          <CardDescription>
            Record student attendance for a specific class and date
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
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
                <label className="text-sm font-medium mb-2 block">Date</label>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handlePreviousDay}
                    disabled={loading}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 text-center py-2 border rounded-md">
                    {format(selectedDate, 'MMMM d, yyyy')}
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleNextDay}
                    disabled={loading || selectedDate >= new Date()}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-800 p-4 rounded-md flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 text-green-800 p-4 rounded-md flex items-center">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                <span>{success}</span>
              </div>
            )}
            
            {selectedClassroom && students.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No students in this classroom</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Invite students to join your classroom to take attendance.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Students</h3>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={markAllPresent} disabled={loading}>
                      Mark All Present
                    </Button>
                    <Button variant="outline" size="sm" onClick={markAllAbsent} disabled={loading}>
                      Mark All Absent
                    </Button>
                  </div>
                </div>
                
                {loading ? (
                  <div className="py-6 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left py-2 px-4 font-medium">Student Name</th>
                          <th className="text-right py-2 px-4 font-medium">Attendance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student, index) => (
                          <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-muted/20'}>
                            <td className="py-3 px-4">{student.firstName} {student.lastName}</td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end space-x-4">
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`present-${student.id}`}
                                    checked={student.isPresent}
                                    onCheckedChange={(checked) => 
                                      handleAttendanceChange(student.id, checked === true)
                                    }
                                  />
                                  <label 
                                    htmlFor={`present-${student.id}`}
                                    className="text-sm cursor-pointer"
                                  >
                                    Present
                                  </label>
                                </div>
                                {student.isPresent ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-500" />
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                <div className="mt-6 flex justify-end">
                  <Button 
                    onClick={handleSubmitAttendance} 
                    disabled={submitting || loading || students.length === 0}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4 mr-2" /> Save Attendance
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}