'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { FileText, ArrowLeft, CalendarIcon, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface Classroom {
  id: string;
  name: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function CreateAssignmentForm() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const classroomIdFromUrl = params.classroomId as string;
  
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string>(classroomIdFromUrl || '');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [isClassWide, setIsClassWide] = useState(true);
  
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
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
        
        if (response.data && response.data.classrooms) {
          console.log('Fetched classrooms:', response.data.classrooms);
          setClassrooms(response.data.classrooms);
          
          if (classroomIdFromUrl) {
            setSelectedClassroom(classroomIdFromUrl);
          } else if (response.data.classrooms.length > 0) {
            setSelectedClassroom(response.data.classrooms[0].id);
          }
        } else {
          console.error('Unexpected response format:', response.data);
          setError('Unexpected response format when loading classrooms');
        }
        
        setLoading(false);
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Failed to load classrooms';
        setError(errorMsg);
        setLoading(false);
        console.error('Error fetching classrooms:', err.response?.data || err);
      }
    };

    if (token) {
      fetchClassrooms();
    }
  }, [token, classroomIdFromUrl]);

  // Fetch students when classroom selection changes
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClassroom) return;
      
      try {
        setStudentsLoading(true);
        console.log(`Fetching students for classroom ID: ${selectedClassroom}`);
        
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/teacher/classrooms/${selectedClassroom}/students`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data && response.data.students) {
          console.log(`Found ${response.data.students.length} students in classroom`);
          setStudents(response.data.students);
          
          // Reset selected students when classroom changes
          setSelectedStudents([]);
        } else {
          console.error('Unexpected response format:', response.data);
        }
      } catch (err: any) {
        console.error('Error fetching students:', err.response?.data || err);
      } finally {
        setStudentsLoading(false);
      }
    };

    if (selectedClassroom) {
      fetchStudents();
    }
  }, [selectedClassroom, token]);

  // Toggle isClassWide handler with validation
  const handleClassWideToggle = (value: boolean) => {
    setIsClassWide(value);
    
    // If switching to individual students, make sure we have students to select
    if (!value && students.length === 0) {
      setError('There are no students in this classroom to assign individually');
    } else {
      // Clear any previous errors about student selection
      if (error && error.includes('students')) {
        setError(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!title.trim()) {
      setError('Please enter a title for the assignment');
      return;
    }
    
    if (!selectedClassroom) {
      setError('Please select a classroom');
      return;
    }
    
    // Validate student selection when using individual assignment
    if (!isClassWide && selectedStudents.length === 0) {
      setError('Please select at least one student for this assignment');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      
      const assignmentData = {
        title,
        description,
        dueDate: dueDate ? dueDate.toISOString() : null,
        classroomId: selectedClassroom,
        isClassWide,
        studentIds: !isClassWide ? selectedStudents : undefined
      };
      
      console.log('Submitting assignment with data:', assignmentData);
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/teacher/assignments`,
        assignmentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Assignment created successfully:', response.data);
      setSuccess('Assignment created successfully');
      
      // Redirect to assignment details after a short delay
      setTimeout(() => {
        router.push(`/dashboard/teacher/assignments/${response.data.assignment.id}`);
      }, 1500);
      
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to create assignment';
      setError(errorMsg);
      console.error('Error creating assignment:', err.response?.data || err);
      setSubmitting(false);
    }
  };

  const handleSelectAllStudents = () => {
    setSelectedStudents(students.map(student => student.id));
  };

  const handleUnselectAllStudents = () => {
    setSelectedStudents([]);
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/teacher/assignments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Create New Assignment</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
            <CardDescription>
              Create an assignment for your students to complete
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block" htmlFor="title">
                  Assignment Title*
                </label>
                <Input 
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter assignment title"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block" htmlFor="description">
                  Description
                </label>
                <Textarea 
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide instructions for the assignment"
                  rows={5}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Classroom*
                  </label>
                  <Select 
                    value={selectedClassroom} 
                    onValueChange={setSelectedClassroom}
                    disabled={!!classroomIdFromUrl || classrooms.length === 0 || loading}
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
                  <label className="text-sm font-medium mb-2 block">
                    Due Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isClassWide"
                  checked={isClassWide}
                  onCheckedChange={handleClassWideToggle}
                />
                <Label htmlFor="isClassWide">
                  Assign to entire class
                </Label>
              </div>
              
              {!isClassWide && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">
                      Select Students
                    </label>
                    <div className="flex space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={handleSelectAllStudents}
                        disabled={students.length === 0}
                      >
                        Select All
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={handleUnselectAllStudents}
                        disabled={selectedStudents.length === 0}
                      >
                        Unselect All
                      </Button>
                    </div>
                  </div>
                  
                  {studentsLoading ? (
                    <div className="flex justify-center items-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : students.length > 0 ? (
                    <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                      <div className="space-y-2">
                        {students.map(student => (
                          <div key={student.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`student-${student.id}`} 
                              checked={selectedStudents.includes(student.id)}
                              onCheckedChange={() => toggleStudentSelection(student.id)}
                            />
                            <label 
                              htmlFor={`student-${student.id}`}
                              className="text-sm cursor-pointer"
                            >
                              {student.firstName} {student.lastName}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4 border rounded-md bg-gray-50">
                      <p className="text-gray-500">No students found in this classroom.</p>
                    </div>
                  )}
                  
                  {!isClassWide && selectedStudents.length > 0 && (
                    <div className="mt-2 text-sm text-blue-600">
                      {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" /> Create Assignment
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}