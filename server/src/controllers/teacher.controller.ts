// server/src/controllers/teacher.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../index';
import { UserRole } from '@prisma/client';
export const getSubmissionDetail = async (req: Request, res: Response) => {
  try {
    const { id: submissionId } = req.params;
    const teacherId = req.user?.id;

    if (!teacherId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Get the submission with related data
    const submission = await prisma.studentAssignment.findUnique({
      where: { id: submissionId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        assignment: {
          select: {
            id: true,
            title: true,
            dueDate: true,
            classroom: {
              select: {
                id: true,
                name: true,
                teachers: {
                  select: {
                    teacherId: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Check if the teacher has access to this submission
    const hasAccess = submission.assignment.classroom.teachers.some(
      teacher => teacher.teacherId === teacherId
    );

    if (!hasAccess) {
      return res.status(403).json({ message: 'You do not have permission to view this submission' });
    }

    res.status(200).json({ submission });
  } catch (error) {
    console.error('Get submission detail error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get assignment details with submissions for a teacher
export const getAssignmentDetails = async (req: Request, res: Response) => {
  try {
    const { id: assignmentId } = req.params;
    const teacherId = req.user?.id;

    if (!teacherId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Check if teacher has access to this assignment
    const teacherHasAccess = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        classroom: {
          teachers: {
            some: {
              teacherId
            }
          }
        }
      }
    });

    if (!teacherHasAccess) {
      return res.status(403).json({ message: 'You do not have access to this assignment' });
    }

    // Get assignment with all submissions
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        classroom: {
          select: {
            id: true,
            name: true,
            students: {
              select: {
                studentId: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        students: {
          select: {
            id: true,
            status: true,
            submittedAt: true,
            grade: true,
            feedback: true,
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

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Calculate total students in the classroom
    const totalStudents = assignment.classroom.students.length;

    // Format response
    const response = {
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        createdAt: assignment.createdAt,
        isActive: assignment.isActive,
        classroom: {
          id: assignment.classroom.id,
          name: assignment.classroom.name
        },
        creator: assignment.creator,
        submissions: assignment.students.map(submission => ({
          id: submission.id,
          status: submission.status,
          submittedAt: submission.submittedAt,
          grade: submission.grade,
          feedback: submission.feedback,
          student: submission.student
        })),
        totalStudents
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Get assignment details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a submission (grade and feedback)
export const updateSubmission = async (req: Request, res: Response) => {
  try {
    const { id: submissionId } = req.params;
    const { grade, feedback } = req.body;
    const teacherId = req.user?.id;

    if (!teacherId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Check if teacher has access to this submission
    const submission = await prisma.studentAssignment.findUnique({
      where: { id: submissionId },
      include: {
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
    });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Verify teacher has access to the classroom
    const hasAccess = submission.assignment.classroom.teachers.some(
      teacher => teacher.teacherId === teacherId
    );

    if (!hasAccess) {
      return res.status(403).json({ message: 'You do not have access to this submission' });
    }

    // Update the submission
    const updatedSubmission = await prisma.studentAssignment.update({
      where: { id: submissionId },
      data: {
        grade: grade !== null ? parseFloat(grade.toString()) : null,
        feedback,
        // If providing a grade for a pending submission, optionally mark as completed
        status: submission.status === 'PENDING' && grade !== null ? 'COMPLETED' : submission.status
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

    res.status(200).json({ submission: updatedSubmission });
  } catch (error) {
    console.error('Update submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send reminder emails to students who haven't submitted
export const sendReminderEmails = async (req: Request, res: Response) => {
  try {
    const { id: assignmentId } = req.params;
    const { studentIds } = req.body;
    const teacherId = req.user?.id;

    if (!teacherId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // In a real application, you would send emails to students
    // For this example, we'll just log it and return success

    console.log(`Sending reminders for assignment ${assignmentId} to students:`, studentIds);

    // Create notifications for students
    if (studentIds && studentIds.length > 0) {
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        select: { title: true }
      });

      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }

      // Create a notification for each student
      await prisma.notification.createMany({
        data: studentIds.map(studentId => ({
          title: 'Assignment Reminder',
          message: `Reminder: Your assignment "${assignment.title}" is due soon. Please submit your work.`,
          senderId: teacherId,
          receiverId: studentId
        }))
      });
    }

    res.status(200).json({ message: 'Reminder emails sent successfully' });
  } catch (error) {
    console.error('Send reminder emails error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
// Get all classrooms where the teacher is assigned
export const getTeacherClassrooms = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Get classrooms where the teacher is assigned
    const classroomTeachers = await prisma.classroomTeacher.findMany({
      where: {
        teacherId: userId
      },
      include: {
        classroom: {
          include: {
            students: true,
            assignments: {
              where: {
                isActive: true
              }
            }
          }
        }
      }
    });

    // Format the response
    const classrooms = classroomTeachers.map(ct => {
      const classroom = ct.classroom;
      return {
        id: classroom.id,
        name: classroom.name,
        description: classroom.description,
        createdAt: classroom.createdAt,
        studentCount: classroom.students.length,
        assignmentCount: classroom.assignments.length
      };
    });

    res.status(200).json({ classrooms });
  } catch (error) {
    console.error('Get teacher classrooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get details for a specific classroom
export const getClassroomDetails = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const classroomId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Check if the teacher is assigned to this classroom
    const classroomTeacher = await prisma.classroomTeacher.findFirst({
      where: {
        teacherId: userId,
        classroomId
      }
    });

    if (!classroomTeacher && req.user?.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'You do not have access to this classroom' });
    }

    // Get classroom details
    const classroom = await prisma.classroom.findUnique({
      where: {
        id: classroomId
      }
    });

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    res.status(200).json({ classroom });
  } catch (error) {
    console.error('Get classroom details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get students in a classroom
export const getClassroomStudents = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const classroomId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Check if the teacher is assigned to this classroom
    const classroomTeacher = await prisma.classroomTeacher.findFirst({
      where: {
        teacherId: userId,
        classroomId
      }
    });

    if (!classroomTeacher && req.user?.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'You do not have access to this classroom' });
    }

    // Get students in the classroom
    const classroomStudents = await prisma.classroomStudent.findMany({
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

    // Format the response
    const students = classroomStudents.map(cs => cs.student);

    res.status(200).json({ students });
  } catch (error) {
    console.error('Get classroom students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get assignments for a classroom
export const getClassroomAssignments = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const classroomId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Check if the teacher is assigned to this classroom
    const classroomTeacher = await prisma.classroomTeacher.findFirst({
      where: {
        teacherId: userId,
        classroomId
      }
    });

    if (!classroomTeacher && req.user?.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'You do not have access to this classroom' });
    }

    // Get assignments in the classroom
    const assignments = await prisma.assignment.findMany({
      where: {
        classroomId
      },
      include: {
        students: true,
        classroom: {
          include: {
            students: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the response
    const formattedAssignments = assignments.map(assignment => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate,
      createdAt: assignment.createdAt,
      isActive: assignment.isActive,
      submissionCount: assignment.students.length,
      totalStudents: assignment.classroom.students.length
    }));

    res.status(200).json({ assignments: formattedAssignments });
  } catch (error) {
    console.error('Get classroom assignments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
// Fixed deleteAssignment function for teacher.controller.ts
export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    // Find the assignment and verify it exists
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: { 
        classroom: {
          include: {
            teachers: true
          }
        }
      }
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check if the user is a teacher of this classroom
    const isTeacher = assignment.classroom.teachers.some(
      teacher => teacher.teacherId === userId
    );

    // Allow assignment creator or admin to delete
    const isCreator = assignment.creatorId === userId;
    const isAdmin = req.user?.role === UserRole.ADMIN;

    if (!isTeacher && !isCreator && !isAdmin) {
      return res.status(403).json({ 
        error: 'Unauthorized: You do not have permission to delete this assignment' 
      });
    }

    // Delete all related student assignments first (to handle foreign key constraints)
    await prisma.studentAssignment.deleteMany({
      where: { assignmentId: id }
    });

    // Delete the assignment
    await prisma.assignment.delete({
      where: { id }
    });

    // Return success
    res.status(200).json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
// Get all assignments for a teacher across all classrooms
export const getAllAssignments = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Get classrooms where the teacher is assigned
    const classroomTeachers = await prisma.classroomTeacher.findMany({
      where: {
        teacherId: userId
      },
      select: {
        classroomId: true
      }
    });

    const classroomIds = classroomTeachers.map(ct => ct.classroomId);

    // Get all assignments for these classrooms
    const assignments = await prisma.assignment.findMany({
      where: {
        classroomId: {
          in: classroomIds
        }
      },
      include: {
        students: true,
        classroom: {
          include: {
            students: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the response
    const formattedAssignments = assignments.map(assignment => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate,
      createdAt: assignment.createdAt,
      isActive: assignment.isActive,
      submissionCount: assignment.students.length,
      totalStudents: assignment.classroom.students.length,
      classroom: {
        id: assignment.classroom.id,
        name: assignment.classroom.name
      }
    }));

    res.status(200).json({ assignments: formattedAssignments });
  } catch (error) {
    console.error('Get all assignments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Updated createAssignment function for server/src/controllers/teacher.controller.ts

export const createAssignment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { title, description, dueDate, classroomId, isClassWide, studentIds } = req.body;

    console.log('Assignment creation request:', {
      userId,
      title,
      classroomId,
      isClassWide,
      studentCount: studentIds?.length || 'N/A'
    });

    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Assignment title is required' });
    }

    if (!classroomId) {
      return res.status(400).json({ message: 'Classroom ID is required' });
    }

    // Check if the teacher is assigned to this classroom
    const classroomTeacher = await prisma.classroomTeacher.findFirst({
      where: {
        teacherId: userId,
        classroomId
      }
    });

    if (!classroomTeacher && req.user?.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'You do not have access to this classroom' });
    }

    // Get the classroom to check if it exists and has students
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        students: true
      }
    });

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    if (classroom.students.length === 0) {
      return res.status(400).json({ message: 'This classroom has no enrolled students' });
    }

    // If individual assignment, validate that studentIds are provided and valid
    if (!isClassWide) {
      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ message: 'Please select at least one student for individual assignment' });
      }

      // Verify all studentIds are enrolled in this classroom
      const enrolledStudentIds = classroom.students.map(cs => cs.studentId);
      const invalidStudentIds = studentIds.filter(id => !enrolledStudentIds.includes(id));

      if (invalidStudentIds.length > 0) {
        return res.status(400).json({ 
          message: 'Some selected students are not enrolled in this classroom',
          invalidIds: invalidStudentIds
        });
      }
    }

    // Create the assignment
    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        isClassWide: isClassWide !== undefined ? isClassWide : true,
        classroom: {
          connect: {
            id: classroomId
          }
        },
        creator: {
          connect: {
            id: userId
          }
        }
      }
    });

    console.log(`Assignment created with ID: ${assignment.id}`);

    // Create student assignments
    let studentAssignments = [];

    if (isClassWide) {
      // If class-wide, assign to all students in the classroom
      const classroomStudents = classroom.students;
      
      studentAssignments = await Promise.all(
        classroomStudents.map(async (cs) => {
          return prisma.studentAssignment.create({
            data: {
              assignment: {
                connect: {
                  id: assignment.id
                }
              },
              student: {
                connect: {
                  id: cs.studentId
                }
              },
              status: 'PENDING'
            }
          });
        })
      );

      console.log(`Created ${studentAssignments.length} class-wide student assignments`);
    } else {
      // If individual, only assign to selected students
      studentAssignments = await Promise.all(
        studentIds.map(async (studentId) => {
          return prisma.studentAssignment.create({
            data: {
              assignment: {
                connect: {
                  id: assignment.id
                }
              },
              student: {
                connect: {
                  id: studentId
                }
              },
              status: 'PENDING'
            }
          });
        })
      );

      console.log(`Created ${studentAssignments.length} individual student assignments`);
    }

    res.status(201).json({ 
      assignment,
      studentAssignments: studentAssignments.length,
      message: 'Assignment created successfully'
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update an existing assignment
export const updateAssignment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const assignmentId = req.params.id;
    const { title, description, dueDate, isActive } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Get the assignment
    const assignment = await prisma.assignment.findUnique({
      where: {
        id: assignmentId
      },
      include: {
        classroom: {
          include: {
            teachers: true
          }
        }
      }
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if the teacher is assigned to this classroom
    const isTeacherAssigned = assignment.classroom.teachers.some(
      teacher => teacher.teacherId === userId
    );

    if (!isTeacherAssigned && req.user?.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'You do not have access to this assignment' });
    }

    // Update the assignment
    const updatedAssignment = await prisma.assignment.update({
      where: {
        id: assignmentId
      },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }
    });

    res.status(200).json({ assignment: updatedAssignment });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get attendance for a classroom on a specific date
export const getAttendance = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const classroomId = req.params.classroomId;
    const date = req.query.date as string;

    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Check if the teacher is assigned to this classroom
    const classroomTeacher = await prisma.classroomTeacher.findFirst({
      where: {
        teacherId: userId,
        classroomId
      }
    });

    if (!classroomTeacher && req.user?.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'You do not have access to this classroom' });
    }

    // Parse the date
    const attendanceDate = date ? new Date(date) : new Date();
    
    // Set the time to the beginning of the day
    attendanceDate.setHours(0, 0, 0, 0);

    // Get attendance records for this date
    const attendanceRecords = await prisma.activityLog.findMany({
      where: {
        userId: {
          in: (await prisma.classroomStudent.findMany({
            where: {
              classroomId
            },
            select: {
              studentId: true
            }
          })).map(cs => cs.studentId)
        },
        date: {
          gte: attendanceDate,
          lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
        },
        isPresent: {
          not: null
        }
      },
      select: {
        id: true,
        userId: true,
        isPresent: true
      }
    });

    res.status(200).json({ 
      date: attendanceDate.toISOString(),
      attendanceRecords: attendanceRecords.map(record => ({
        id: record.id,
        studentId: record.userId,
        isPresent: record.isPresent
      }))
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Submit attendance for a classroom
export const submitAttendance = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const classroomId = req.params.classroomId;
    const { date, attendanceRecords } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Check if the teacher is assigned to this classroom
    const classroomTeacher = await prisma.classroomTeacher.findFirst({
      where: {
        teacherId: userId,
        classroomId
      }
    });

    if (!classroomTeacher && req.user?.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'You do not have access to this classroom' });
    }

    // Parse the date
    const attendanceDate = new Date(date);
    
    // Set the time to the beginning of the day
    attendanceDate.setHours(0, 0, 0, 0);

    // Process attendance records
    const results = await Promise.all(
      attendanceRecords.map(async (record: { studentId: string; isPresent: boolean }) => {
        // Check if an attendance record already exists for this student and date
        const existingRecord = await prisma.activityLog.findFirst({
          where: {
            userId: record.studentId,
            date: {
              gte: attendanceDate,
              lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
            },
            isPresent: {
              not: null
            }
          }
        });

        if (existingRecord) {
          // Update existing record
          return prisma.activityLog.update({
            where: {
              id: existingRecord.id
            },
            data: {
              isPresent: record.isPresent
            }
          });
        } else {
          // Create new record
          return prisma.activityLog.create({
            data: {
              user: {
                connect: {
                  id: record.studentId
                }
              },
              date: attendanceDate,
              isPresent: record.isPresent
            }
          });
        }
      })
    );

    res.status(200).json({ 
      message: 'Attendance submitted successfully',
      date: attendanceDate.toISOString(),
      records: results.length
    });
  } catch (error) {
    console.error('Submit attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get analytics for a classroom
export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const classroomId = req.params.classroomId;
    const timeRange = req.query.timeRange as string || 'month';

    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Check if the teacher is assigned to this classroom
    const classroomTeacher = await prisma.classroomTeacher.findFirst({
      where: {
        teacherId: userId,
        classroomId
      }
    });

    if (!classroomTeacher && req.user?.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'You do not have access to this classroom' });
    }

    // Determine date range based on timeRange parameter
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'semester':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 4);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
    }

    // Get classroom students
    const classroomStudents = await prisma.classroomStudent.findMany({
      where: {
        classroomId
      },
      select: {
        studentId: true,
        student: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    const studentIds = classroomStudents.map(cs => cs.studentId);

    // Get attendance data
    const attendanceRecords = await prisma.activityLog.findMany({
      where: {
        userId: {
          in: studentIds
        },
        date: {
          gte: startDate,
          lte: now
        },
        isPresent: {
          not: null
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Group attendance by date
    const attendanceByDate = attendanceRecords.reduce((acc, record) => {
      const dateString = record.date.toISOString().split('T')[0];
      
      if (!acc[dateString]) {
        acc[dateString] = {
          total: 0,
          present: 0
        };
      }
      
      acc[dateString].total += 1;
      if (record.isPresent) {
        acc[dateString].present += 1;
      }
      
      return acc;
    }, {} as Record<string, { total: number; present: number }>);

    // Calculate attendance percentages
    const dates = Object.keys(attendanceByDate).sort();
    const presentPercentages = dates.map(date => 
      Math.round((attendanceByDate[date].present / attendanceByDate[date].total) * 100)
    );

    // Calculate average attendance
    const averageAttendance = Math.round(
      presentPercentages.reduce((sum, percentage) => sum + percentage, 0) / 
      (presentPercentages.length || 1)
    );

    // Get assignment data
    const assignments = await prisma.assignment.findMany({
      where: {
        classroomId,
        createdAt: {
          gte: startDate,
          lte: now
        }
      },
      include: {
        students: true
      }
    });

    // Calculate assignment completion statistics
    const totalAssignments = assignments.length;
    const totalPossibleSubmissions = assignments.reduce(
      (sum, assignment) => sum + studentIds.length, 
      0
    );
    const totalActualSubmissions = assignments.reduce(
      (sum, assignment) => sum + assignment.students.filter(s => s.status === 'COMPLETED').length, 
      0
    );
    const assignmentCompletionRate = totalPossibleSubmissions > 0
      ? Math.round((totalActualSubmissions / totalPossibleSubmissions) * 100)
      : 0;

    // Group assignments by status
    const assignmentsByStatus = [
      { 
        name: 'Completed', 
        value: assignments.reduce(
          (sum, assignment) => sum + assignment.students.filter(s => s.status === 'COMPLETED').length, 
          0
        )
      },
      { 
        name: 'Pending', 
        value: assignments.reduce(
          (sum, assignment) => sum + assignment.students.filter(s => s.status === 'PENDING').length, 
          0
        ) 
      },
      { 
        name: 'Overdue', 
        value: assignments.reduce(
          (sum, assignment) => sum + assignment.students.filter(s => s.status === 'OVERDUE').length, 
          0
        ) 
      }
    ];

    // Calculate average scores per assignment
    const assignmentScores = assignments.map(assignment => {
      const scores = assignment.students
        .filter(s => s.grade !== null)
        .map(s => s.grade as number);
      
      const average = scores.length > 0
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : 0;
      
      return {
        name: assignment.title,
        average
      };
    });

    // Calculate student performance metrics
    // Get average grade for each student across all assignments
    const studentPerformance = await Promise.all(
      studentIds.map(async (studentId) => {
        // Get all assignments for this student
        const studentAssignments = await prisma.studentAssignment.findMany({
          where: {
            studentId,
            assignment: {
              classroomId
            },
            grade: {
              not: null
            }
          },
          select: {
            grade: true
          }
        });
        
        // Calculate average score
        const grades = studentAssignments.map(sa => sa.grade as number);
        const averageScore = grades.length > 0
          ? Math.round(grades.reduce((sum, grade) => sum + grade, 0) / grades.length)
          : 0;
        
        // Get student name
        const student = classroomStudents.find(cs => cs.studentId === studentId);
        const studentName = student 
          ? `${student.student.firstName} ${student.student.lastName}`
          : `Student ${studentId}`;
        
        return {
          studentId,
          name: studentName,
          score: averageScore
        };
      })
    );

    // Count performance categories
    const highPerformers = studentPerformance.filter(sp => sp.score >= 80).length;
    const averagePerformers = studentPerformance.filter(sp => sp.score >= 60 && sp.score < 80).length;
    const lowPerformers = studentPerformance.filter(sp => sp.score < 60).length;

    // Format student scores for chart display
    const studentScores = studentPerformance
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .map(sp => ({
        name: sp.name,
        score: sp.score
      }));

    res.status(200).json({
      attendanceData: {
        dates,
        presentPercentages,
        averageAttendance
      },
      assignmentData: {
        assignmentCompletionRate,
        assignmentsByStatus,
        assignmentScores
      },
      studentPerformance: {
        highPerformers,
        averagePerformers,
        lowPerformers,
        studentScores
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};