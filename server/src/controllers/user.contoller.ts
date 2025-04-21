// server/src/controllers/user.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../index';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Get all users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        isActive: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Get user by id error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create user
export const createUser = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: role as UserRole
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        isActive: true
      }
    });

    res.status(201).json({ user });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, role, isActive, password } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is taken by another user
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });

      if (emailExists) {
        return res.status(400).json({ message: 'Email is already taken' });
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        isActive: true
      }
    });

    res.status(200).json({ user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user
    await prisma.user.delete({
      where: { id }
    });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Search users with consistent data source
export const searchUsersConsistent = async (req: Request, res: Response) => {
  try {
    const { role, query } = req.query;
    
    // Get all users first (same as getAllUsers)
    let users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Then filter them based on role (if provided)
    if (role && typeof role === 'string') {
      users = users.filter(user => user.role === role);
    }
    
    // Filter based on search term (if provided)
    if (query && typeof query === 'string' && query.length > 0) {
      const searchTerm = query.toLowerCase();
      users = users.filter(user => 
        user.firstName.toLowerCase().includes(searchTerm) || 
        user.lastName.toLowerCase().includes(searchTerm) || 
        user.email.toLowerCase().includes(searchTerm)
      );
    }
    
    console.log(`Found ${users.length} users matching search criteria`);
    
    res.status(200).json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all users of a specific role - useful for debugging
export const getAllUsersByRole = async (req: Request, res: Response) => {
  try {
    const { role } = req.query;
    
    // Validate role parameter
    let userRole: UserRole | undefined;
    if (role && typeof role === 'string') {
      if (Object.values(UserRole).includes(role as UserRole)) {
        userRole = role as UserRole;
      } else {
        return res.status(400).json({ message: 'Invalid role parameter' });
      }
    }
    
    // Build the where clause
    const whereClause: any = {
      isActive: true,
    };
    
    // Add role filter if provided
    if (userRole) {
      whereClause.role = userRole;
    }
    
    // Get all users of the specified role
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });
    
    res.status(200).json({ users });
  } catch (error) {
    console.error('Get all users by role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Improved search users function with more flexible searching
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { role, query } = req.query;
    
    // Allow empty queries for role-based listing
    if (!query && !role) {
      return res.status(400).json({ message: 'Either role or query parameter is required' });
    }
    
    // Validate role parameter
    let userRole: UserRole | undefined;
    if (role && typeof role === 'string') {
      if (Object.values(UserRole).includes(role as UserRole)) {
        userRole = role as UserRole;
      } else {
        return res.status(400).json({ message: 'Invalid role parameter' });
      }
    }
    
    // Build the where clause for the search
    const whereClause: any = {
      isActive: true,
    };
    
    // Add role filter if provided
    if (userRole) {
      whereClause.role = userRole;
    }
    
    // Add search filters if query provided
    if (query && typeof query === 'string' && query.length > 0) {
      whereClause.OR = [
        { firstName: { contains: query } },
        { lastName: { contains: query } },
        { email: { contains: query } }
      ];
    }
    
    // Log the query for debugging
    console.log('Search query:', whereClause);
    
    // Perform the search
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ],
      take: 20 // Increased limit for testing
    });
    
    // Log results count for debugging
    console.log(`Found ${users.length} users matching the criteria`);
    
    res.status(200).json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};