'use client';

import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Loader2, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface UserSearchSelectProps {
  role: 'TEACHER' | 'STUDENT';
  onUserSelect: (user: User) => void;
  classroomId?: string;
  existingUsers?: User[];
  placeholder?: string;
}

export default function UserSearchSelect({
  role,
  onUserSelect,
  classroomId,
  existingUsers = [],
  placeholder = "Search users..."
}: UserSearchSelectProps) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch users when component mounts or search term changes
  useEffect(() => {
    // Don't fetch if popover is closed
    if (!open) return;
    
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use the proper endpoint
        let url = `${process.env.NEXT_PUBLIC_API_URL}/api/users/search?role=${role}`;
        if (searchTerm) {
          url += `&query=${encodeURIComponent(searchTerm)}`;
        }
        if (classroomId) {
          url += `&classroomId=${classroomId}`;
        }
        
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Filter out users that are already in the classroom (if needed)
        let userData = response.data.users || [];
        
        if (existingUsers && existingUsers.length > 0) {
          userData = userData.filter((user: User) => 
            !existingUsers.some(existingUser => existingUser.id === user.id)
          );
        }
        
        setUsers(userData);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
        
        // Fallback mock data for testing
        setUsers([
          { id: '1', firstName: 'John', lastName: 'Doe', email: 'student1@school.edu', role },
          { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'student2@school.edu', role },
          { id: '3', firstName: 'Alice', lastName: 'Johnson', email: 'student3@school.edu', role },
          { id: '4', firstName: 'Bob', lastName: 'Brown', email: 'student4@school.edu', role },
          { id: '5', firstName: 'Charlie', lastName: 'Davis', email: 'student5@school.edu', role },
          { id: '6', firstName: 'Diana', lastName: 'Miller', email: 'student6@school.edu', role },
          { id: '7', firstName: 'Edward', lastName: 'Wilson', email: 'student7@school.edu', role },
          { id: '8', firstName: 'Fiona', lastName: 'Taylor', email: 'student8@school.edu', role },
          { id: '9', firstName: 'George', lastName: 'Thomas', email: 'student9@school.edu', role },
          { id: '10', firstName: 'Hannah', lastName: 'Jackson', email: 'student10@school.edu', role },
        ]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [open, searchTerm, token, role, classroomId, existingUsers]);

  const handleSelect = (userId: string) => {
    console.log("Selecting user with ID:", userId);
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      onUserSelect(user);
      setOpen(false);
    }
  };

  const clearSelection = () => {
    setSelectedUser(null);
    setSearchTerm('');
  };

  return (
    <div className="flex flex-col space-y-2">
      {selectedUser ? (
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1.5">
            <User className="h-3.5 w-3.5 mr-1.5 opacity-70" />
            {`${selectedUser.firstName} ${selectedUser.lastName}`}
            <span className="text-xs text-muted-foreground ml-1">({selectedUser.email})</span>
            <button 
              onClick={clearSelection}
              className="ml-2 rounded-full hover:bg-gray-300/20 p-1"
              type="button"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      ) : (
        <div className="relative w-full">
          {/* Use a simple button that shows a dropdown */}
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setOpen(!open)}
            type="button"
          >
            <span>{placeholder}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
          
          {/* Manual dropdown implementation instead of Popover */}
          {open && (
            <div className="absolute z-50 w-full mt-1 bg-popover rounded-md border shadow-md overflow-hidden">
              <div className="p-2">
                <input
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder={`Search ${role.toLowerCase()}s...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="text-sm px-3 py-1 text-muted-foreground">
                Available {role}s
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : users.length === 0 ? (
                <div className="py-6 text-center text-sm">
                  No {role.toLowerCase()}s found.
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto py-1">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 mx-1"
                      onClick={() => handleSelect(user.id)}
                    >
                      <div className="ml-2">
                        <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}