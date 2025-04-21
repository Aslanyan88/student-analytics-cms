'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Users, Clock, Search, Filter, Plus, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { Input } from '@/components/ui/input';

interface Classroom {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  studentCount: number;
  assignmentCount: number;
}

export default function TeacherClassrooms() {
  const { user, token } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [filteredClassrooms, setFilteredClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        setLoading(true);
        
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/teacher/classrooms`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setClassrooms(response.data.classrooms);
        setFilteredClassrooms(response.data.classrooms);
        setLoading(false);
      } catch (err: any) {
        setError('Failed to load classrooms');
        setLoading(false);
        console.error('Error fetching classrooms:', err);
      }
    };

    fetchClassrooms();
  }, [token]);

  useEffect(() => {
    // Filter classrooms based on search query
    if (searchQuery.trim() === '') {
      setFilteredClassrooms(classrooms);
    } else {
      const filtered = classrooms.filter(classroom => 
        classroom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (classroom.description && classroom.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredClassrooms(filtered);
    }
  }, [searchQuery, classrooms]);

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
        <h1 className="text-2xl font-bold">My Classrooms</h1>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search classrooms..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {filteredClassrooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No classrooms found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {classrooms.length === 0 
              ? "You haven't been assigned to any classrooms yet." 
              : "No classrooms match your search criteria."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClassrooms.map((classroom) => (
            <Card key={classroom.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle>{classroom.name}</CardTitle>
                <CardDescription>
                  {classroom.description || "No description available"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{classroom.studentCount} students</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{classroom.assignmentCount} assignments</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-3 border-t">
                <Button asChild className="w-full">
                  <Link href={`/dashboard/teacher/classrooms/${classroom.id}`}>
                    View Classroom
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}