'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '../contexts/AuthContext';
import {
  Book,
  Users,
  FileText,
  Calendar,
  BarChart,
  Settings,
  LogOut,
  Home,
  X,
  Bot,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AIAssistant from '../components/AiAssistant';

interface SidebarProps {
  isMobileMenuOpen: boolean;
  closeMobileMenu: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileMenuOpen, closeMobileMenu }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isAIAssistantMinimized, setIsAIAssistantMinimized] = useState(false);

  const getMenuItems = () => {
    const baseItems = [
      {
        title: 'Dashboard',
        href: `/dashboard/${user?.role.toLowerCase()}`,
        icon: <Home className="w-5 h-5" />
      }
    ];

    const adminItems = [
      {
        title: 'Classrooms',
        href: '/dashboard/admin/classrooms',
        icon: <Book className="w-5 h-5" />
      },
      {
        title: 'Users',
        href: '/dashboard/admin/users',
        icon: <Users className="w-5 h-5" />
      },
      {
        title: 'Reports',
        href: '/dashboard/admin/reports',
        icon: <BarChart className="w-5 h-5" />
      }
    ];

    const teacherItems = [
      {
        title: 'Classrooms',
        href: '/dashboard/teacher/classrooms',
        icon: <Book className="w-5 h-5" />
      },
      {
        title: 'Assignments',
        href: '/dashboard/teacher/assignments',
        icon: <FileText className="w-5 h-5" />
      },
      {
        title: 'Attendance',
        href: '/dashboard/teacher/attendance',
        icon: <Calendar className="w-5 h-5" />
      },
      {
        title: 'Analytics',
        href: '/dashboard/teacher/analytics',
        icon: <BarChart className="w-5 h-5" />
      }
    ];

    const studentItems = [
      {
        title: 'Classrooms',
        href: '/dashboard/student/classrooms',
        icon: <Book className="w-5 h-5" />
      },
      {
        title: 'Assignments',
        href: '/dashboard/student/assignments',
        icon: <FileText className="w-5 h-5" />
      }
    ];

    switch (user?.role) {
      case 'ADMIN':
        return [...baseItems, ...adminItems];
      case 'TEACHER':
        return [...baseItems, ...teacherItems];
      case 'STUDENT':
        return [...baseItems, ...studentItems];
      default:
        return baseItems;
    }
  };

  // Open AI Assistant
  const openAIAssistant = () => {
    setIsAIAssistantOpen(true);
    setIsAIAssistantMinimized(false);
  };

  // Close AI Assistant
  const closeAIAssistant = () => {
    setIsAIAssistantOpen(false);
  };

  // Minimize AI Assistant
  const minimizeAIAssistant = () => {
    setIsAIAssistantMinimized(true);
  };

  return (
    <>
      <div
        className={cn(
          'bg-primary text-primary-foreground w-64 flex flex-col h-full transition-transform duration-300 ease-in-out',
          'md:relative md:translate-x-0',
          isMobileMenuOpen
            ? 'fixed inset-y-0 left-0 z-50 translate-x-0'
            : 'fixed inset-y-0 left-0 z-50 -translate-x-full'
        )}
      >
        {/* Mobile close button */}
        <div className="flex justify-end p-4 md:hidden">
          <Button variant="ghost" size="icon" onClick={closeMobileMenu}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>

        <div className="px-6 py-6">
          <div className="text-xl font-bold">Student Analytics</div>
          <div className="text-xs opacity-70">Class Management System</div>
        </div>

        <div className="px-6 py-2">
          <div className="bg-primary-foreground/10 rounded-lg p-3">
            <div className="font-semibold">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-xs opacity-70">{user?.role}</div>
          </div>
        </div>

        <nav className="mt-6 flex-1 px-4">
          <ul className="space-y-1">
            {getMenuItems().map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={cn(
                    'flex items-center px-4 py-3 text-sm rounded-md transition-colors',
                    pathname === item.href
                      ? 'bg-primary-foreground/20 text-primary-foreground font-medium'
                      : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10'
                  )}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.title}
                </Link>
              </li>
            ))}
            
            {/* AI Assistant Button */}
            <li>
              <button
                onClick={openAIAssistant}
                className="flex items-center w-full px-4 py-3 text-sm rounded-md transition-colors text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                <span className="mr-3"><MessageSquare className="w-5 h-5" /></span>
                AI Assistant
              </button>
            </li>
          </ul>
        </nav>

        <div className="p-4 mt-auto">
          <button
            onClick={logout}
            className="flex items-center px-4 py-3 text-sm rounded-md w-full text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Floating AI Assistant */}
      <AIAssistant 
        isOpen={isAIAssistantOpen && !isAIAssistantMinimized} 
        onClose={closeAIAssistant}
        onMinimize={minimizeAIAssistant}
      />

      {/* Minimized AI Assistant */}
      {isAIAssistantMinimized && (
        <div 
          className="fixed bottom-4 right-4 bg-primary text-white p-3 rounded-full shadow-lg cursor-pointer z-50 hover:bg-primary/90 transition-colors"
          onClick={() => setIsAIAssistantMinimized(false)}
        >
          <Bot className="h-6 w-6" />
        </div>
      )}
    </>
  );
}