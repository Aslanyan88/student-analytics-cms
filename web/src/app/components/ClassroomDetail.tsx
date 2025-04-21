'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { AlertTriangle, ArrowLeft, Save, Trash, Mail, UserPlus, PencilLine } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Link from 'next/link';
import UserSearchSelect from '../components/UserSearchSelect';

// Define interfaces
interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ClassroomTeacher {
  id: string;
  teacher: Teacher;
  assignedAt: string;
}

interface ClassroomStudent {
  id: string;
  student: Student;
  assignedAt: string;
}

interface Classroom {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  teachers: ClassroomTeacher[];
  students: ClassroomStudent[];
}

export default function ClassroomDetail() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'details';
  const classroomId = params.id as string;
  const { token } = useAuth();
  const router = useRouter();
  
  // State for classroom data
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for editing classroom
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });
  const [saving, setSaving] = useState(false);
  
  // State for adding teachers
  const [isAddTeacherDialogOpen, setIsAddTeacherDialogOpen] = useState(false);
  const [addingTeacher, setAddingTeacher] = useState(false);
  const [addTeacherError, setAddTeacherError] = useState<string | null>(null);
  
  // State for adding students
  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
  const [addingStudent, setAddingStudent] = useState(false);
  const [addStudentError, setAddStudentError] = useState<string | null>(null);
  
  // State for search filters
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Fetch classroom data
  useEffect(() => {
    const fetchClassroom = async () => {
      try {
        setLoading(true);
        
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/classrooms/${classroomId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const classroomData = response.data.classroom;
        setClassroom(classroomData);
        
        // Initialize edit form with classroom data
        setEditFormData({
          name: classroomData.name,
          description: classroomData.description || '',
          isActive: classroomData.isActive
        });
        
        setLoading(false);
      } catch (err: any) {
        setError('Failed to load classroom details');
        setLoading(false);
        console.error('Error fetching classroom:', err);
      }
    };

    if (classroomId) {
      fetchClassroom();
    } else {
      setLoading(false);
    }
  }, [classroomId, token]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    router.push(`/dashboard/admin/classrooms/${classroomId}?tab=${value}`);
  };

  // Handle edit form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };

  // Handle switch change for active status
  const handleSwitchChange = (checked: boolean) => {
    setEditFormData({
      ...editFormData,
      isActive: checked
    });
  };

  // Handle saving classroom updates
  const handleSaveClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classrooms/${classroomId}`,
        editFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      if (classroom) {
        setClassroom({
          ...classroom,
          name: editFormData.name,
          description: editFormData.description,
          isActive: editFormData.isActive
        });
      }
      
      setSaving(false);
    } catch (err: any) {
      setError('Failed to update classroom');
      setSaving(false);
      console.error('Error updating classroom:', err);
    }
  };

  // Handle adding a teacher
  const handleAddTeacher = async (teacher: Teacher) => {
    try {
      setAddingTeacher(true);
      setAddTeacherError(null);
      
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classrooms/${classroomId}/teachers`,
        { teacherId: teacher.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh classroom data
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classrooms/${classroomId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setClassroom(response.data.classroom);
      setAddingTeacher(false);
      setIsAddTeacherDialogOpen(false);
    } catch (err: any) {
      setAddTeacherError(err.response?.data?.message || 'Failed to add teacher');
      setAddingTeacher(false);
      console.error('Error adding teacher:', err);
    }
  };

  // Handle adding a student
  const handleAddStudent = async (student: Student) => {
    try {
      setAddingStudent(true);
      setAddStudentError(null);
      
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classrooms/${classroomId}/students`,
        { studentId: student.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh classroom data
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classrooms/${classroomId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setClassroom(response.data.classroom);
      setAddingStudent(false);
      setIsAddStudentDialogOpen(false);
    } catch (err: any) {
      setAddStudentError(err.response?.data?.message || 'Failed to add student');
      setAddingStudent(false);
      console.error('Error adding student:', err);
    }
  };

  // Handle removing a teacher
  const handleRemoveTeacher = async (teacherId: string) => {
    if (!confirm('Are you sure you want to remove this teacher from the classroom?')) {
      return;
    }
    
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classrooms/${classroomId}/teachers/${teacherId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      if (classroom) {
        setClassroom({
          ...classroom,
          teachers: classroom.teachers.filter(t => t.teacher.id !== teacherId)
        });
      }
    } catch (err: any) {
      setError('Failed to remove teacher');
      console.error('Error removing teacher:', err);
    }
  };

  // Handle removing a student
  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to remove this student from the classroom?')) {
      return;
    }
    
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classrooms/${classroomId}/students/${studentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      if (classroom) {
        setClassroom({
          ...classroom,
          students: classroom.students.filter(s => s.student.id !== studentId)
        });
      }
    } catch (err: any) {
      setError('Failed to remove student');
      console.error('Error removing student:', err);
    }
  };

  // Filter teachers based on search query
  const filteredTeachers = classroom?.teachers.filter(t => {
    const fullName = `${t.teacher.firstName} ${t.teacher.lastName}`.toLowerCase();
    const email = t.teacher.email.toLowerCase();
    const query = teacherSearchQuery.toLowerCase();
    
    return fullName.includes(query) || email.includes(query);
  }) || [];

  // Filter students based on search query
  const filteredStudents = classroom?.students.filter(s => {
    const fullName = `${s.student.firstName} ${s.student.lastName}`.toLowerCase();
    const email = s.student.email.toLowerCase();
    const query = studentSearchQuery.toLowerCase();
    
    return fullName.includes(query) || email.includes(query);
  }) || [];

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

  if (!classroom) {
    return (
      <div className="p-4">
        <div className="bg-amber-50 text-amber-800 p-4 rounded-md flex items-center mb-6">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <span>Classroom not found</span>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/classrooms">Back to Classrooms</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{classroom.name}</h1>
          <p className="text-muted-foreground">
            {classroom.isActive ? (
              <span className="text-green-600">Active</span>
            ) : (
              <span className="text-gray-500">Inactive</span>
            )}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/admin/classrooms">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Classrooms
          </Link>
        </Button>
      </div>

      <Tabs defaultValue={tab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">
            <PencilLine className="h-4 w-4 mr-2" /> Details
          </TabsTrigger>
          <TabsTrigger value="teachers">
            <UserPlus className="h-4 w-4 mr-2" /> Teachers ({classroom.teachers.length})
          </TabsTrigger>
          <TabsTrigger value="students">
            <UserPlus className="h-4 w-4 mr-2" /> Students ({classroom.students.length})
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Edit Classroom</CardTitle>
              <CardDescription>Update classroom information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveClassroom} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Classroom Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={editFormData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={editFormData.description}
                    onChange={handleInputChange}
                    rows={4}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={editFormData.isActive}
                    onCheckedChange={handleSwitchChange}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" /> Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teachers Tab */}
        <TabsContent value="teachers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Manage Teachers</CardTitle>
                <CardDescription>Add or remove teachers from this classroom</CardDescription>
              </div>
              <Dialog open={isAddTeacherDialogOpen} onOpenChange={setIsAddTeacherDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" /> Add Teacher
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Teacher to Classroom</DialogTitle>
                    <DialogDescription>
                      Search for an existing teacher to add to this classroom.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <UserSearchSelect 
                      role="TEACHER"
                      onUserSelect={handleAddTeacher}
                      classroomId={classroom.id}
                      existingUsers={classroom.teachers.map(t => t.teacher)}
                      placeholder="Search for teachers..."
                    />
                    {addTeacherError && (
                      <div className="bg-red-50 text-red-800 p-2 rounded-md text-sm">
                        {addTeacherError}
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddTeacherDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Search assigned teachers..."
                  value={teacherSearchQuery}
                  onChange={(e) => setTeacherSearchQuery(e.target.value)}
                  className="max-w-md"
                />
              </div>
              
              {classroom.teachers.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No teachers assigned to this classroom yet.
                </div>
              ) : filteredTeachers.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No teachers match your search.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Assigned On</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.map((teacherAssignment) => (
                      <TableRow key={teacherAssignment.id}>
                        <TableCell className="font-medium">
                          {teacherAssignment.teacher.firstName} {teacherAssignment.teacher.lastName}
                        </TableCell>
                        <TableCell>{teacherAssignment.teacher.email}</TableCell>
                        <TableCell>
                          {new Date(teacherAssignment.assignedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => window.location.href = `mailto:${teacherAssignment.teacher.email}`}
                            >
                              <Mail className="h-4 w-4" />
                              <span className="sr-only">Email</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRemoveTeacher(teacherAssignment.teacher.id)}
                            >
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Manage Students</CardTitle>
                <CardDescription>Add or remove students from this classroom</CardDescription>
              </div>
              <Dialog open={isAddStudentDialogOpen} onOpenChange={setIsAddStudentDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" /> Add Student
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Student to Classroom</DialogTitle>
                    <DialogDescription>
                      Search for an existing student to add to this classroom.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <UserSearchSelect 
                      role="STUDENT"
                      onUserSelect={handleAddStudent}
                      classroomId={classroom.id}
                      existingUsers={classroom.students.map(s => s.student)}
                      placeholder="Search for students..."
                    />
                    {addStudentError && (
                      <div className="bg-red-50 text-red-800 p-2 rounded-md text-sm">
                        {addStudentError}
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddStudentDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Search enrolled students..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="max-w-md"
                />
              </div>
              
              {classroom.students.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No students enrolled in this classroom yet.
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No students match your search.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Enrolled On</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((studentAssignment) => (
                      <TableRow key={studentAssignment.id}>
                        <TableCell className="font-medium">
                          {studentAssignment.student.firstName} {studentAssignment.student.lastName}
                        </TableCell>
                        <TableCell>{studentAssignment.student.email}</TableCell>
                        <TableCell>
                          {new Date(studentAssignment.assignedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => window.location.href = `mailto:${studentAssignment.student.email}`}
                            >
                              <Mail className="h-4 w-4" />
                              <span className="sr-only">Email</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRemoveStudent(studentAssignment.student.id)}
                            >
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}