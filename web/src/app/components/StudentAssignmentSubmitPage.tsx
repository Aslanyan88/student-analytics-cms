'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertTriangle, ArrowLeft, Calendar, Upload, X, FileText, AlertCircle } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import axios from 'axios';

interface AssignmentSubmitProps {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  classroomName: string;
}

export default function StudentAssignmentSubmitPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [assignment, setAssignment] = useState<AssignmentSubmitProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    const fetchAssignmentDetail = async () => {
      try {
        setLoading(true);
        const assignmentId = params.id;
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/student/assignments/${assignmentId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAssignment(response.data.assignment);
        setLoading(false);
      } catch (err: any) {
        setError('Failed to load assignment details');
        setLoading(false);
        console.error('Error fetching assignment details:', err);
      }
    };

    if (params.id) {
      fetchAssignmentDetail();
    }
  }, [params.id, token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prevFiles => [...prevFiles, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!assignment) return;
    
    try {
      setSubmitting(true);
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('comment', comment);
      files.forEach(file => {
        formData.append('files', file);
      });

      // Submit assignment
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/student/assignments/${assignment.id}/submit`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );

      toast("Your teacher will review your submission soon.");

      // Navigate back to the assignment detail page
      router.push(`/dashboard/student/assignments/${assignment.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit assignment');
      toast( "There was an error submitting your assignment",);
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Submit Assignment</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{assignment.title}</CardTitle>
          <div className="text-sm text-gray-500">
            <span>{assignment.classroomName}</span> • 
            <span className="ml-2">Due: {formatDate(assignment.dueDate)}</span>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit}>
            {isOverdue(assignment.dueDate) && (
              <div className="bg-red-50 p-4 rounded-md flex items-start mb-6">
                <AlertCircle className="h-5 w-5 mr-2 text-red-500 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">This assignment is overdue</p>
                  <p className="text-sm text-red-600">
                    Your submission will be marked as late. Please contact your teacher if you need an extension.
                  </p>
                </div>
              </div>
            )}
            
            <div className="space-y-6">
              <div>
                <Label htmlFor="comment" className="text-base font-medium">Comment</Label>
                <Textarea
                  id="comment"
                  placeholder="Add any comments about your submission here..."
                  className="mt-2 h-32"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="files" className="text-base font-medium">Upload Files</Label>
                <div className="mt-2">
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-3 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-gray-500">PDF, DOCX, XLSX, PPTX, JPG, PNG (MAX. 10MB)</p>
                      </div>
                      <Input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        multiple
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Selected Files</h3>
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-blue-500" />
                            <span className="text-sm truncate">{file.name}</span>
                            <span className="text-xs text-gray-500 ml-2">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent rounded-full"></div>
                Submitting...
              </>
            ) : (
              <>Submit Assignment</>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}