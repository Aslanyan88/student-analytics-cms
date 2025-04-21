// server/src/controllers/student.assignment.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../index';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/assignments');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Allow only certain file types
    const allowedExtensions = [
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', 
      '.ppt', '.pptx', '.jpg', '.jpeg', '.png'
    ];
    
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, XLSX, PPTX, JPG, and PNG files are allowed.'));
    }
  }
});

// Get a single assignment for a student
export const getStudentAssignment = async (req: Request, res: Response) => {
  try {
    const studentId = req.user?.id;
    const assignmentId = req.params.id;

    if (!studentId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Get the assignment details
    const assignment = await prisma.assignment.findUnique({
      where: {
        id: assignmentId,
        isActive: true
      },
      include: {
        classroom: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if the student is enrolled in this classroom
    const enrollment = await prisma.classroomStudent.findFirst({
      where: {
        studentId,
        classroomId: assignment.classroomId
      }
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'You are not enrolled in this classroom' });
    }

    // Get the student's assignment status
    const studentAssignment = await prisma.studentAssignment.findFirst({
      where: {
        studentId,
        assignmentId
      }
    });

    if (!studentAssignment) {
      // If student doesn't have an assignment record yet, create one
      const newStudentAssignment = await prisma.studentAssignment.create({
        data: {
          assignmentId,
          studentId,
          status: 'PENDING'
        }
      });
      
      // Format the response
      const response = {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        status: 'PENDING',
        submittedAt: null,
        grade: null,
        feedback: null,
        classroom: {
          id: assignment.classroom.id,
          name: assignment.classroom.name
        }
      };
      
      return res.status(200).json({ assignment: response });
    }

    // Check if the assignment is overdue
    const dueDate = assignment.dueDate;
    const isOverdue = dueDate && new Date(dueDate) < new Date() && studentAssignment.status === 'PENDING';
    
    // Update status to OVERDUE if needed
    let status = studentAssignment.status;
    if (isOverdue) {
      status = 'OVERDUE';
      // Update in database
      await prisma.studentAssignment.update({
        where: { id: studentAssignment.id },
        data: { status: 'OVERDUE' }
      });
    }

    // Format the response
    const response = {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate,
      status: status,
      submittedAt: studentAssignment.submittedAt,
      grade: studentAssignment.grade,
      feedback: studentAssignment.feedback,
      classroom: {
        id: assignment.classroom.id,
        name: assignment.classroom.name
      }
    };

    res.status(200).json({ assignment: response });
  } catch (error) {
    console.error('Get student assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Submit an assignment
export const submitStudentAssignment = async (req: Request, res: Response) => {
  try {
    const studentId = req.user?.id;
    const assignmentId = req.params.id;
    const { comment } = req.body;
    
    if (!studentId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Check if the assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: {
        id: assignmentId,
        isActive: true
      }
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if the student is enrolled in this classroom
    const enrollment = await prisma.classroomStudent.findFirst({
      where: {
        studentId,
        classroomId: assignment.classroomId
      }
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'You are not enrolled in this classroom' });
    }

    // Get student assignment record or create if it doesn't exist
    let studentAssignment = await prisma.studentAssignment.findFirst({
      where: {
        studentId,
        assignmentId
      }
    });

    if (!studentAssignment) {
      studentAssignment = await prisma.studentAssignment.create({
        data: {
          assignmentId,
          studentId,
          status: 'PENDING'
        }
      });
    }

    if (studentAssignment.status === 'COMPLETED') {
      return res.status(400).json({ message: 'Assignment has already been submitted' });
    }

    // Process uploaded files
    const files = req.files as Express.Multer.File[];
    
    // Create file records using Prisma transaction
    await prisma.$transaction(async (prisma) => {
      // Update student assignment status
      await prisma.studentAssignment.update({
        where: {
          id: studentAssignment!.id
        },
        data: {
          status: 'COMPLETED',
          submittedAt: new Date(),
          submissionContent: comment || null  // Changed from 'comment' to 'submissionContent'
        }
      });
      
      // Create file records if there are any uploaded files
      if (files && files.length > 0) {
        for (const file of files) {
          await prisma.submissionFile.create({
            data: {
              studentAssignmentId: studentAssignment!.id,
              filename: file.originalname,
              filePath: file.path,
              fileSize: file.size,
              fileType: file.mimetype
            }
          });
        }
      }
      
      // Create an activity log for the submission
      await prisma.activityLog.create({
        data: {
          userId: studentId,
          action: 'ASSIGNMENT_SUBMISSION',
          details: `Submitted assignment: ${assignment.title}`
        }
      });
    });

    res.status(200).json({
      message: 'Assignment submitted successfully',
      submittedAt: new Date(),
      files: files.map(f => ({
        filename: f.originalname,
        fileSize: f.size
      }))
    });
  } catch (error) {
    console.error('Submit student assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
export const getStudentDashboardStats = async (req: Request, res: Response) => {
  try {
    const studentId = req.user?.id;

    if (!studentId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Get student's classrooms
    const classrooms = await prisma.classroomStudent.findMany({
      where: {
        studentId
      },
      select: {
        classroomId: true
      }
    });

    const classroomIds = classrooms.map(c => c.classroomId);

    // Get total number of classrooms
    const totalClassrooms = classroomIds.length;

    // Get student assignments
    const studentAssignments = await prisma.studentAssignment.findMany({
      where: {
        studentId
      },
      include: {
        assignment: {
          include: {
            classroom: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Count assignments by status
    let activeAssignments = 0;
    let completedAssignments = 0;
    let overdueAssignments = 0;
    
    // Check for overdue assignments and update their status
    for (const sa of studentAssignments) {
      const dueDate = sa.assignment.dueDate;
      const isOverdue = dueDate && new Date(dueDate) < new Date() && sa.status === 'PENDING';
      
      if (isOverdue) {
        // Update assignment status to OVERDUE in database
        await prisma.studentAssignment.update({
          where: { id: sa.id },
          data: { status: 'OVERDUE' }
        });
        
        overdueAssignments++;
      } else if (sa.status === 'COMPLETED') {
        completedAssignments++;
      } else if (sa.status === 'PENDING') {
        activeAssignments++;
      }
    }

    // Get upcoming assignments (due in the next 7 days)
    const now = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(now.getDate() + 7);

    const upcomingAssignments = studentAssignments
      .filter(sa => 
        sa.status === 'PENDING' && 
        sa.assignment.dueDate && 
        new Date(sa.assignment.dueDate) > now &&
        new Date(sa.assignment.dueDate) <= oneWeekFromNow
      )
      .map(sa => ({
        id: sa.assignmentId,
        title: sa.assignment.title,
        dueDate: sa.assignment.dueDate,
        classroomName: sa.assignment.classroom.name
      }))
      // Sort by due date (ascending)
      .sort((a, b) => 
        new Date(a.dueDate as string).getTime() - new Date(b.dueDate as string).getTime()
      )
      // Limit to 5 upcoming assignments
      .slice(0, 5);

    // Return dashboard stats
    res.status(200).json({
      totalClassrooms,
      activeAssignments,
      completedAssignments,
      overdueAssignments,
      upcomingAssignments
    });
  } catch (error) {
    console.error('Get student dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};