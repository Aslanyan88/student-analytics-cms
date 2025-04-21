'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, ArrowLeft, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Link from 'next/link';

export default function CreateClassroom() {
  const { token } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setCreating(true);
      setError(null);
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classrooms`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setCreating(false);
      
      // Redirect to the newly created classroom
      router.push(`/dashboard/admin/classrooms/${response.data.classroom.id}?tab=details`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create classroom');
      setCreating(false);
      console.error('Error creating classroom:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create New Classroom</h1>
        <Button variant="outline" asChild>
          <Link href="/dashboard/admin/classrooms">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Classrooms
          </Link>
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Classroom Information</CardTitle>
          <CardDescription>Enter the details for the new classroom</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Classroom Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Mathematics 101"
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
                placeholder="Brief description of this classroom"
                rows={4}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" asChild>
                <Link href="/dashboard/admin/classrooms">Cancel</Link>
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" /> Create Classroom
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );}