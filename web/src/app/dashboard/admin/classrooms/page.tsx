'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { AlertTriangle, Plus, Search, MoreHorizontal, Edit, Trash, Users } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import axios from 'axios';
import Link from 'next/link';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';

interface Classroom {
  id: string;
  name: string;
  description: string;
  teacherCount: number;
  studentCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function ClassroomsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        setLoading(true);
        
        // Fetch actual data from the backend
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/classrooms`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setClassrooms(response.data.classrooms);
        setLoading(false);
      } catch (err: any) {
        setError('Failed to load classrooms');
        setLoading(false);
        console.error('Error fetching classrooms:', err);
        
        // Fallback to mock data for development if API fails
        if (process.env.NODE_ENV === 'development') {
          console.log('Using mock data as fallback');
          setClassrooms([
            {
              id: '1',
              name: 'Mathematics 101',
              description: 'Introduction to basic mathematics concepts',
              teacherCount: 2,
              studentCount: 28,
              isActive: true,
              createdAt: '2024-01-15'
            },
            {
              id: '2',
              name: 'Advanced Algebra',
              description: 'Advanced algebraic equations and concepts',
              teacherCount: 1,
              studentCount: 22,
              isActive: true,
              createdAt: '2024-01-20'
            },
            {
              id: '3',
              name: 'Biology',
              description: 'Study of living organisms',
              teacherCount: 2,
              studentCount: 30,
              isActive: true,
              createdAt: '2024-02-05'
            },
            {
              id: '4',
              name: 'Chemistry',
              description: 'Study of matter and its properties',
              teacherCount: 1,
              studentCount: 25,
              isActive: true,
              createdAt: '2024-02-10'
            }
          ]);
          setLoading(false);
        }
      }
    };

    fetchClassrooms();
  }, [token]);

  const handleDeleteClassroom = async (id: string) => {
    if (!confirm('Are you sure you want to delete this classroom? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classrooms/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setClassrooms(classrooms.filter(classroom => classroom.id !== id));
    } catch (err: any) {
      setError('Failed to delete classroom');
      console.error('Error deleting classroom:', err);
    }
  };

  const filteredClassrooms = classrooms.filter(classroom => 
    classroom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    classroom.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Classrooms</h1>
        <Button asChild>
          <Link href="/dashboard/admin/classrooms/new">
            <Plus className="mr-2 h-4 w-4" /> Add Classroom
          </Link>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search classrooms..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">Filter</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Teachers</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClassrooms.map((classroom) => (
                <TableRow key={classroom.id}>
                  <TableCell className="font-medium">{classroom.name}</TableCell>
                  <TableCell>{classroom.description}</TableCell>
                  <TableCell>{classroom.teacherCount}</TableCell>
                  <TableCell>{classroom.studentCount}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      classroom.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {classroom.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(classroom.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/admin/classrooms/${classroom.id}?tab=details`}>
                            <Edit className="h-4 w-4 mr-2" /> Edit Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/admin/classrooms/${classroom.id}?tab=teachers`}>
                            <Users className="h-4 w-4 mr-2" /> Manage Teachers
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/admin/classrooms/${classroom.id}?tab=students`}>
                            <Users className="h-4 w-4 mr-2" /> Manage Students
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600 cursor-pointer"
                          onClick={() => handleDeleteClassroom(classroom.id)}
                        >
                          <Trash className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredClassrooms.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    No classrooms found. Try a different search term or create a new classroom.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}