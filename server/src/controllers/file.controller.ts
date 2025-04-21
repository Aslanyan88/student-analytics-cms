// server/src/controllers/file.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../index';
import path from 'path';
import fs from 'fs';
import { UserRole } from '@prisma/client';

// Get a specific file by ID and stream it to the client
export const getFile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const fileId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Find the file in the database
    const file = await prisma.submissionFile.findUnique({
      where: { id: fileId },
      include: {
        studentAssignment: {
          include: {
            student: true,
            assignment: {
              include: {
                classroom: {
                  include: {
                    teachers: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    const isStudent = file.studentAssignment.studentId === userId;
    const isTeacher = file.studentAssignment.assignment.classroom.teachers.some(t => t.teacherId === userId);
    const isAdmin = req.user?.role === UserRole.ADMIN;

    if (!isStudent && !isTeacher && !isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to access this file' });
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', file.fileType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.filename)}"`);
    
    // Stream the file to the client
    const fileStream = fs.createReadStream(file.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a specific file
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const fileId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Find the file in the database
    const file = await prisma.submissionFile.findUnique({
      where: { id: fileId },
      include: {
        studentAssignment: {
          include: {
            student: true,
          }
        }
      }
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Only the student who submitted the file or an admin can delete it
    const isStudent = file.studentAssignment.studentId === userId;
    const isAdmin = req.user?.role === UserRole.ADMIN;

    if (!isStudent && !isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to delete this file' });
    }

    // Delete file from disk if it exists
    if (fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath);
    }

    // Delete file record from database
    await prisma.submissionFile.delete({
      where: { id: fileId }
    });

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};