import { Request, Response } from 'express';
import { prisma } from '../index';
import { UserRole } from '@prisma/client';

// Get all classrooms where the student is enrolled
export const getStudentClassrooms = async (req: Request, res: Response) => {
  try {
    const studentId = req.user?.id;

    if (!studentId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Get classrooms where student is enrolled
    const enrolledClassrooms = await prisma.classroomStudent.findMany({
      where: {
        studentId
      },
      include: {
        classroom: {
          select: {
            id: true,
            name: true,
            description: true,
            assignments: {
              where: {
                isActive: true,
                dueDate: {
                  gte: new Date()
                }
              },
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    // Format response
    const classrooms = enrolledClassrooms.map(enrollment => ({
      id: enrollment.classroom.id,
      name: enrollment.classroom.name,
      description: enrollment.classroom.description,
      activeAssignments: enrollment.classroom.assignments.length
    }));

    res.status(200).json({ classrooms });
  } catch (error) {
    console.error('Get student classrooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get specific classroom details including members and assignments
export const getClassroomDetails = async (req: Request, res: Response) => {
  try {
    const studentId = req.user?.id;
    const { classroomId } = req.params;

    if (!studentId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Check if student is enrolled in this classroom
    const enrollment = await prisma.classroomStudent.findFirst({
      where: {
        studentId,
        classroomId
      }
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'You are not enrolled in this classroom' });
    }

    // Get classroom details
    const classroom = await prisma.classroom.findUnique({
      where: {
        id: classroomId
      },
      select: {
        id: true,
        name: true,
        description: true
      }
    });

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Get teachers for this classroom
    const teachers = await prisma.classroomTeacher.findMany({
      where: {
        classroomId
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Get students for this classroom
    const students = await prisma.classroomStudent.findMany({
      where: {
        classroomId
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Get assignments for this classroom and student status
    const assignments = await prisma.assignment.findMany({
      where: {
        classroomId,
        isActive: true
      },
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        students: {
          where: {
            studentId
          },
          select: {
            status: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    // Format the response
    const formattedAssignments = assignments.map(assignment => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description || '',
      dueDate: assignment.dueDate?.toISOString() || new Date().toISOString(),
      status: assignment.students[0]?.status || 'PENDING'
    }));

    const formattedTeachers = teachers.map(teacher => ({
      id: teacher.teacher.id,
      firstName: teacher.teacher.firstName,
      lastName: teacher.teacher.lastName,
      email: teacher.teacher.email,
      role: 'TEACHER' as const
    }));

    const formattedStudents = students.map(student => ({
      id: student.student.id,
      firstName: student.student.firstName,
      lastName: student.student.lastName,
      email: student.student.email,
      role: 'STUDENT' as const
    }));

    res.status(200).json({
      id: classroom.id,
      name: classroom.name,
      description: classroom.description,
      teachers: formattedTeachers,
      students: formattedStudents,
      assignments: formattedAssignments
    });
  } catch (error) {
    console.error('Get classroom details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get assignments for the student
export const getStudentAssignments = async (req: Request, res: Response) => {
  try {
    const studentId = req.user?.id;

    if (!studentId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    console.log(`Fetching assignments for student ID: ${studentId}`);

    // Get all student assignments
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
      },
      orderBy: {
        assignment: {
          dueDate: 'asc'
        }
      }
    });

    console.log(`Found ${studentAssignments.length} assignments`);

    // Format the response
    const formattedAssignments = studentAssignments.map(sa => ({
      id: sa.assignmentId,
      title: sa.assignment.title,
      description: sa.assignment.description,
      status: sa.status,
      grade: sa.grade,
      feedback: sa.feedback,
      submittedAt: sa.submittedAt,
      dueDate: sa.assignment.dueDate,
      classroom: {
        id: sa.assignment.classroom.id,
        name: sa.assignment.classroom.name
      }
    }));

    console.log(`Returning ${formattedAssignments.length} formatted assignments`);

    // Set proper response
    res.status(200).json({ 
      assignments: formattedAssignments,
      count: formattedAssignments.length
    });
  } catch (error) {
    console.error('Get student assignments error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
};