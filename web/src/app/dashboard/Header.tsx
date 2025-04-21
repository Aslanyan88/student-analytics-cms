'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { Bell, Search, Menu, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import axios from 'axios';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface HeaderProps {
  toggleMobileMenu: () => void;
}

const defaultNotifications: Notification[] = [
  {
    id: 'default-1',
    title: 'Welcome to the System',
    message: 'Welcome to the student management system. Get started by exploring the dashboard.',
    isRead: false,
    createdAt: new Date().toISOString(),
    sender: {
      id: 'system',
      firstName: 'System',
      lastName: 'Admin',
    },
  },
  {
    id: 'default-2',
    title: 'New Features Available',
    message: 'Check out the new attendance tracking and grade management tools.',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    sender: {
      id: 'system',
      firstName: 'System',
      lastName: 'Admin',
    },
  },
  {
    id: 'default-3',
    title: 'Getting Started Guide',
    message: 'Need help? Check out our comprehensive guide in the help section.',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    sender: {
      id: 'system',
      firstName: 'Support',
      lastName: 'Team',
    },
  },
];

export const Header: React.FC<HeaderProps> = ({ toggleMobileMenu }) => {
  const pathname = usePathname();
  const { user, token, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(defaultNotifications);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get page title from pathname
  const getPageTitle = () => {
    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments.length < 3) {
      return 'Dashboard';
    }
    const lastSegment = pathSegments[pathSegments.length - 1];
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U';
    return `${user.firstName[0]}${user.lastName[0]}`;
  };

  // Format date to relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!token) return;
      try {
        setLoading(true);
        try {
          // const response = await axios.get(
          //   `${process.env.NEXT_PUBLIC_API_URL}/api/notifications`,
          //   { headers: { Authorization: `Bearer ${token}` } }
          // );
          // let apiNotifications = [];
          // if (response.data && response.data.notifications) {
          //   apiNotifications = response.data.notifications;
          // }
          // if (apiNotifications.length === 0) {
            setNotifications(defaultNotifications);
          // } else {
          //   setNotifications(apiNotifications);
          // }
        } catch (err) {
          console.error('Error fetching notifications from API:', err);
          setNotifications(defaultNotifications);
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to load notifications');
        setLoading(false);
        console.error('Error in notification handling:', err);
        setNotifications(defaultNotifications);
      }
    };
    fetchNotifications();
  }, [token]);

  const markAsRead = async (id: string) => {
    if (!token) return;
    try {
      setNotifications(notifications.map((notification) =>
        notification.id === id ? { ...notification, isRead: true } : notification
      ));
      if (!id.startsWith('default-')) {
        // try {
        //   await axios.put(
        //     `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${id}/read`,
        //     {},
        //     { headers: { Authorization: `Bearer ${token}` } }
        //   );
        // } catch (err) {
        //   console.error('Error marking notification as read:', err);
        // }
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      setNotifications(notifications.map((notification) => ({ ...notification, isRead: true })));
      const realNotificationIds = notifications
        .filter((n) => !n.id.startsWith('default-'))
        .map((n) => n.id);
      if (realNotificationIds.length > 0) {
        // try {
        //   await axios.put(
        //     `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/read-all`,
        //     {},
        //     { headers: { Authorization: `Bearer ${token}` } }
        //   );
        // } catch (err) {
        //   console.error('Error marking all notifications as read:', err);
        // }
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleMobileMenu}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <h1 className="text-xl font-semibold hidden md:block">{getPageTitle()}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-64 pl-8 rounded-md bg-gray-50 focus:bg-white"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute top-0 right-0 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                    {unreadCount}
                  </Badge>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex justify-between items-center">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-blue-600 h-auto p-1"
                    onClick={markAllAsRead}
                  >
                    Mark all as read
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="h-[300px] overflow-auto">
                {loading ? (
                  <div className="flex justify-center items-center h-16">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-gray-50 border-b last:border-0 ${
                        !notification.isRead ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex justify-between">
                        <h4 className="text-sm font-medium">{notification.title}</h4>
                        <div className="flex space-x-1">
                          {!notification.isRead && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                              <span className="sr-only">Mark as read</span>
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">
                          From: {notification.sender.firstName} {notification.sender.lastName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
              <DropdownMenuSeparator />
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <span>{user?.firstName} {user?.lastName}</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span className="text-xs">{user?.email}</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};