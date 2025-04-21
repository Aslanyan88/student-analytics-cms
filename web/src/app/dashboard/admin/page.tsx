'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { Users, BookOpen, GraduationCap, AlertTriangle, Clock } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

interface DashboardStats {
  totalUsers: number;
  totalClassrooms: number;
  totalTeachers: number;
  totalStudents: number;
  activeAssignments: number;
  recentActivities: RecentActivity[];
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
  };
}

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalClassrooms: 0,
    totalTeachers: 0,
    totalStudents: 0,
    activeAssignments: 0,
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        
        // Fetch actual data from the backend
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/dashboard-stats`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setStats(response.data);
        setLoading(false);
      } catch (err: any) {
        setError('Failed to load dashboard stats');
        setLoading(false);
        console.error('Error fetching dashboard stats:', err);
      }
    };

    fetchDashboardStats();
  }, [token]);

  // Format timestamp to relative time (e.g., "2 hours ago")
  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
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
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex space-x-2">
          <Button asChild>
            <Link href="/dashboard/admin/classrooms/new">New Classroom</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/admin/users/new">Add User</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalTeachers} teachers, {stats.totalStudents} students
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Classrooms</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClassrooms}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all departments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeachers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active teaching staff
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAssignments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently in progress
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest actions in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivities && stats.recentActivities.length > 0 ? (
                stats.recentActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="border-b pb-2">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.user.name} - {getRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No recent activities</div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>System Notifications</CardTitle>
            <CardDescription>
              Important alerts and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 bg-amber-50 p-3 rounded-md">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Database backup scheduled</p>
                  <p className="text-xs">Planned maintenance tonight at 2:00 AM</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 bg-green-50 p-3 rounded-md">
                <AlertTriangle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">New feature available</p>
                  <p className="text-xs">Attendance tracking system has been updated</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 bg-blue-50 p-3 rounded-md">
                <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">End of semester approaching</p>
                  <p className="text-xs">Reminder to prepare final exams and reports</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}