// server/src/controllers/classroom.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../index';

// Get all classrooms
export const getAllClassrooms = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    let classrooms;
    
    // Different queries based on role
    if (userRole === 'ADMIN') {
      // Admins can see all classrooms
      classrooms = await prisma.classroom.findMany({
        where: { isActive: true },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          teachers: {
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
          },
          students: {
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
          }
        }
      });
    } else if (userRole === 'TEACHER') {
      // Teachers see classrooms they are assigned to
      classrooms = await prisma.classroom.findMany({
        where: {
          OR: [
            { creatorId: userId },
            {
              teachers: {
                some: {
                  teacherId: userId
                }
              }
            }
          ],
          isActive: true
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          teachers: {
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
          },
          students: {
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
          }
        }
      });
    } else {
      // Students see classrooms they are assigned to
      classrooms = await prisma.classroom.findMany({
        where: {
          students: {
            some: {
              studentId: userId
            }
          },
          isActive: true
        },
        include: {
          teachers: {
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
          }
        }
      });
    }

    // Transform the classrooms data to match frontend expectations
    const transformedClassrooms = classrooms.map(classroom => ({
      id: classroom.id,
      name: classroom.name,
      description: classroom.description || '',
      teacherCount: classroom.teachers ? classroom.teachers.length : 0,
      studentCount: classroom.students ? classroom.students.length : 0,
      isActive: classroom.isActive,
      createdAt: classroom.createdAt.toISOString()
    }));

    res.status(200).json({ classrooms: transformedClassrooms });
  } catch (error) {
    console.error('Get all classrooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single classroom
export const getClassroom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        teachers: {
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
        },
        students: {
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
        },
        assignments: true
      }
    });

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Check if user has access
    if (userRole !== 'ADMIN') {
      const isTeacher = classroom.teachers.some(t => t.teacherId === userId) || 
                       classroom.creatorId === userId;
      
      const isStudent = classroom.students.some(s => s.studentId === userId);

      if (!isTeacher && !isStudent) {
        return res.status(403).json({ message: 'Not authorized to access this classroom' });
      }
    }

    res.status(200).json({ classroom });
  } catch (error) {
    console.error('Get classroom error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create classroom
export const createClassroom = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const userId = req.user?.id;

    const classroom = await prisma.classroom.create({
      data: {
        name,
        description,
        creatorId: userId as string
      }
    });

    res.status(201).json({ classroom });
  } catch (error) {
    console.error('Create classroom error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update classroom
export const updateClassroom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Check if classroom exists
    const existingClassroom = await prisma.classroom.findUnique({
      where: { id },
      include: {
        teachers: true
      }
    });

    if (!existingClassroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Only creator or admin can update
    if (userRole !== 'ADMIN' && existingClassroom.creatorId !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this classroom' });
    }

    const classroom = await prisma.classroom.update({
      where: { id },
      data: {
        name,
        description,
        isActive
      }
    });

    res.status(200).json({ classroom });
  } catch (error) {
    console.error('Update classroom error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete classroom
export const deleteClassroom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Check if classroom exists
    const existingClassroom = await prisma.classroom.findUnique({
      where: { id }
    });

    if (!existingClassroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Only creator or admin can delete
    if (userRole !== 'ADMIN' && existingClassroom.creatorId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this classroom' });
    }

    await prisma.classroom.delete({
      where: { id }
    });

    res.status(200).json({ message: 'Classroom deleted successfully' });
  } catch (error) {
    console.error('Delete classroom error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add teacher to classroom - modified to only work with existing teachers
export const addTeacherToClassroom = async (req: Request, res: Response) => {
  try {
    const { classroomId } = req.params;
    const { teacherId } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Check if classroom exists
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId }
    });

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Only creator or admin can add teachers
    if (userRole !== 'ADMIN' && classroom.creatorId !== userId) {
      return res.status(403).json({ message: 'Not authorized to add teachers to this classroom' });
    }

    // Verify teacherId is provided
    if (!teacherId) {
      return res.status(400).json({ message: 'Teacher ID is required' });
    }

    // Find the teacher
    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherId,
        role: 'TEACHER',
        isActive: true
      }
    });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Check if teacher is already assigned to classroom
    const existingAssignment = await prisma.classroomTeacher.findFirst({
      where: {
        classroomId,
        teacherId: teacher.id
      }
    });

    if (existingAssignment) {
      return res.status(400).json({ message: 'Teacher already assigned to this classroom' });
    }

    // Add teacher to classroom
    const classroomTeacher = await prisma.classroomTeacher.create({
      data: {
        classroomId,
        teacherId: teacher.id
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

    res.status(201).json({ classroomTeacher });
  } catch (error) {
    console.error('Add teacher to classroom error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add student to classroom - modified to only work with existing students
export const addStudentToClassroom = async (req: Request, res: Response) => {
  try {
    const { classroomId } = req.params;
    const { studentId } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Check if classroom exists
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        teachers: true
      }
    });

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Check if user has permission (admin, creator, or assigned teacher)
    const isTeacher = classroom.teachers.some(t => t.teacherId === userId);
    if (userRole !== 'ADMIN' && classroom.creatorId !== userId && !isTeacher) {
      return res.status(403).json({ message: 'Not authorized to add students to this classroom' });
    }

    // Verify studentId is provided
    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    // Find the student
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        role: 'STUDENT',
        isActive: true
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if student is already assigned to classroom
    const existingAssignment = await prisma.classroomStudent.findFirst({
      where: {
        classroomId,
        studentId: student.id
      }
    });

    if (existingAssignment) {
      return res.status(400).json({ message: 'Student already assigned to this classroom' });
    }

    // Add student to classroom
    const classroomStudent = await prisma.classroomStudent.create({
      data: {
        classroomId,
        studentId: student.id
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

    res.status(201).json({ classroomStudent });
  } catch (error) {
    console.error('Add student to classroom error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove teacher from classroom
export const removeTeacherFromClassroom = async (req: Request, res: Response) => {
  try {
    const { classroomId, teacherId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Check if classroom exists
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId }
    });

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Only creator or admin can remove teachers
    if (userRole !== 'ADMIN' && classroom.creatorId !== userId) {
      return res.status(403).json({ message: 'Not authorized to remove teachers from this classroom' });
    }

    // Check if teacher is assigned to classroom
    const classroomTeacher = await prisma.classroomTeacher.findFirst({
      where: {
        classroomId,
        teacherId
      }
    });

    if (!classroomTeacher) {
      return res.status(404).json({ message: 'Teacher not assigned to this classroom' });
    }

    // Remove teacher from classroom
    await prisma.classroomTeacher.delete({
      where: {
        id: classroomTeacher.id
      }
    });

    res.status(200).json({ message: 'Teacher removed from classroom successfully' });
  } catch (error) {
    console.error('Remove teacher from classroom error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove student from classroom
export const removeStudentFromClassroom = async (req: Request, res: Response) => {
  try {
    const { classroomId, studentId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Check if classroom exists
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        teachers: true
      }
    });

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Check if user has permission (admin, creator, or assigned teacher)
    const isTeacher = classroom.teachers.some(t => t.teacherId === userId);
    if (userRole !== 'ADMIN' && classroom.creatorId !== userId && !isTeacher) {
      return res.status(403).json({ message: 'Not authorized to remove students from this classroom' });
    }

    // Check if student is assigned to classroom
    const classroomStudent = await prisma.classroomStudent.findFirst({
      where: {
        classroomId,
        studentId
      }
    });

    if (!classroomStudent) {
      return res.status(404).json({ message: 'Student not assigned to this classroom' });
    }

    // Remove student from classroom
    await prisma.classroomStudent.delete({
      where: {
        id: classroomStudent.id
      }
    });

    res.status(200).json({ message: 'Student removed from classroom successfully' });
  } catch (error) {
    console.error('Remove student from classroom error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};