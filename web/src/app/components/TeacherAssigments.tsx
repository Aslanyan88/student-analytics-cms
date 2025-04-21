'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import {
  AlertTriangle, Clock, Search, FileText,
  CheckCircle2, ChevronDown, Trash2, Loader2
} from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import toast from 'react-hot-toast';

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  createdAt: string;
  isActive: boolean;
  submissionCount: number;
  totalStudents: number;
  classroom: {
    id: string;
    name: string;
  };
}

interface Classroom {
  id: string;
  name: string;
}

export default function TeacherAssignments() {
  const { user, token } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [userClassroomIds, setUserClassroomIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classroomFilter, setClassroomFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch user’s classrooms
        const userClassroomsResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/teacher/classrooms`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const userClassrooms = userClassroomsResponse.data.classrooms;
        const classroomIds = userClassrooms.map((c: Classroom) => c.id);
        console.log('User classrooms:', classroomIds);
        setUserClassroomIds(classroomIds);
        setClassrooms(userClassrooms);

        // Fetch all assignments
        const assignmentsResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/teacher/assignments`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Assignments:', assignmentsResponse.data.assignments.map((a: Assignment) => ({
          id: a.id,
          classroomId: a.classroom.id,
        })));
        setAssignments(assignmentsResponse.data.assignments);

        setLoading(false);
      } catch (err: any) {
        setError('Failed to load assignments');
        setLoading(false);
        console.error('Error fetching assignments:', err);
      }
    };

    console.log('Authenticated user:', { id: user.id, role: user.role });
    fetchData();
  }, [token, user]);

  useEffect(() => {
    let filtered = [...assignments];

    if (searchQuery) {
      filtered = filtered.filter(assignment =>
        assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (assignment.description && assignment.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(assignment =>
        statusFilter === 'active' ? assignment.isActive : !assignment.isActive
      );
    }

    if (classroomFilter !== 'all') {
      filtered = filtered.filter(assignment =>
        assignment.classroom.id === classroomFilter
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'dueDate':
        default:
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
    });

    setFilteredAssignments(filtered);
  }, [assignments, searchQuery, statusFilter, classroomFilter, sortBy]);

  // Fixed handleDelete function for TeacherAssignments component
const handleDelete = async (assignmentId: string) => {
  setDeletingId(assignmentId);
  
  try {
    // Send the delete request directly
    await axios.delete(
      `${process.env.NEXT_PUBLIC_API_URL}/api/teacher/assignments/${assignmentId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Update the state to remove the deleted assignment
    setAssignments(assignments.filter(assignment => assignment.id !== assignmentId));
    toast.success('Assignment deleted successfully');
  } catch (err: any) {
    // Handle error with more detailed information
    console.error('Error deleting assignment:', err);
    const errorMessage = err.response?.data?.error || 'Failed to delete assignment';
    
    // Display different error messages based on status code
    if (err.response?.status === 401) {
      toast.error('Session expired. Please log in again.');
    } else if (err.response?.status === 403) {
      toast.error('You do not have permission to delete this assignment');
    } else if (err.response?.status === 404) {
      toast.error('Assignment not found');
      // Still remove it from the UI since it doesn't exist
      setAssignments(assignments.filter(assignment => assignment.id !== assignmentId));
    } else {
      toast.error(errorMessage);
    }
  } finally {
    setDeletingId(null);
  }
};

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (assignment: Assignment) => {
    if (!assignment.isActive) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Inactive</Badge>;
    }

    if (!assignment.dueDate) {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Open</Badge>;
    }

    const now = new Date();
    const dueDate = new Date(assignment.dueDate);

    if (dueDate < now) {
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Past Due</Badge>;
    }

    const fortyEightHours = 2 * 24 * 60 * 60 * 1000;
    if (dueDate.getTime() - now.getTime() < fortyEightHours) {
      return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">Due Soon</Badge>;
    }

    return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Upcoming</Badge>;
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
        <h1 className="text-2xl font-bold">Assignments</h1>
        <div className="flex space-x-2">
          <Button asChild>
            <Link href="/dashboard/teacher/assignments/new">
              <FileText className="h-4 w-4 mr-2" /> Create Assignment
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search assignments..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={classroomFilter} onValueChange={setClassroomFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Classroom" />
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[130px]">
                Sort By <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy('dueDate')}>
                Due Date
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('title')}>
                Title
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('createdAt')}>
                Date Created
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {filteredAssignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No assignments found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {assignments.length === 0
              ? "You haven't created any assignments yet."
              : "No assignments match your search criteria."}
          </p>
          {assignments.length === 0 && (
            <Button className="mt-4" asChild>
              <Link href="/dashboard/teacher/assignments/new">Create Assignment</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <CardTitle>{assignment.title}</CardTitle>
                      {getStatusBadge(assignment)}
                    </div>
                    <CardDescription>
                      {assignment.description || 'No description available'}
                    </CardDescription>
                  </div>
                  <div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-100">
                      {assignment.classroom.name}
                    </Badge>
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
                    <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
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
                  {userClassroomIds.includes(assignment.classroom.id) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={deletingId === assignment.id}
                        >
                          {deletingId === assignment.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the assignment "
                            {assignment.title}" and all associated submissions.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(assignment.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}