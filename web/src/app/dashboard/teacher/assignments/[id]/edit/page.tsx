'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Loader2 } from 'lucide-react';
import axios from 'axios';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  isActive: boolean;
  classroomId: string;
}

interface Classroom {
  id: string;
  name: string;
}

export default function EditAssignment() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    isActive: true,
    classroomId: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch assignment details
        const assignmentResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/teacher/assignments/${assignmentId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const assignmentData = assignmentResponse.data.assignment;
        setAssignment(assignmentData);
        setFormData({
          title: assignmentData.title,
          description: assignmentData.description || '',
          dueDate: assignmentData.dueDate
            ? new Date(assignmentData.dueDate).toISOString().split('T')[0]
            : '',
          isActive: assignmentData.isActive,
          classroomId: assignmentData.classroomId,
        });

        // Fetch classrooms for dropdown
        const classroomsResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/teacher/classrooms`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setClassrooms(classroomsResponse.data.classrooms);

        setLoading(false);
      } catch (err: any) {
        setError('Failed to load assignment');
        setLoading(false);
        console.error('Error fetching assignment:', err);
      }
    };

    fetchData();
  }, [token, assignmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/teacher/assignments/${assignmentId}`,
        {
          title: formData.title,
          description: formData.description || null,
          dueDate: formData.dueDate || null,
          isActive: formData.isActive,
          classroomId: formData.classroomId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      router.push('/dashboard/teacher/assignments');
    } catch (err: any) {
      setError('Failed to update assignment');
      console.error('Error updating assignment:', err);
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="p-4">
        <div className="bg-red-50 text-red-800 p-4 rounded-md flex items-center mb-6">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <span>{error || 'Assignment not found'}</span>
        </div>
        <Button onClick={() => router.push('/dashboard/teacher/assignments')}>
          Back to Assignments
        </Button>
      </div>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Edit Assignment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="classroomId">Classroom</Label>
            <Select
              value={formData.classroomId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, classroomId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select classroom" />
              </SelectTrigger>
              <SelectContent>
                {classrooms.map((classroom) => (
                  <SelectItem key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isActive: !!checked }))
              }
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          {error && (
            <div className="bg-red-50 text-red-800 p-4 rounded-md flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/teacher/assignments')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}