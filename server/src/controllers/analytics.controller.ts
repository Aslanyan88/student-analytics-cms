// server/src/controllers/analytics.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../index';
import { UserRole } from '@prisma/client';

// Get classroom analytics for all classrooms (admin only)
export const getClassroomAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { dateFrom, dateTo } = req.query;
    
    // Parse dates if provided
    const fromDate = dateFrom ? new Date(dateFrom as string) : undefined;
    const toDate = dateTo ? new Date(dateTo as string) : undefined;
    
    // Only admin can access all classroom analytics
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to access this resource' });
    }
    
    // Get all classrooms with their analytics
    const classrooms = await prisma.classroom.findMany({
      where: {
        isActive: true,
        // Add date filtering if provided
        ...(fromDate && toDate ? {
          assignments: {
            some: {
              createdAt: {
                gte: fromDate,
                lte: toDate
              }
            }
          }
        } : {})
      },
      select: {
        id: true,
        name: true,
        description: true,
        students: {
          select: {
            student: {
              select: {
                id: true
              }
            }
          }
        },
        assignments: {
          where: {
            ...(fromDate && toDate ? {
              createdAt: {
                gte: fromDate,
                lte: toDate
              }
            } : {})
          },
          select: {
            id: true,
            students: {
              select: {
                grade: true,
                status: true
              }
            }
          }
        },
        _count: {
          select: {
            students: true,
            assignments: true
          }
        }
      }
    });
    
    // Calculate metrics for each classroom
    const classroomStats = classrooms.map(classroom => {
      // Calculate average score
      let totalScore = 0;
      let totalGradedAssignments = 0;
      
      classroom.assignments.forEach(assignment => {
        assignment.students.forEach(studentAssignment => {
          if (studentAssignment.grade !== null) {
            totalScore += studentAssignment.grade;
            totalGradedAssignments++;
          }
        });
      });
      
      const averageScore = totalGradedAssignments > 0 
        ? Math.round((totalScore / totalGradedAssignments) * 100) / 100
        : 0;
        
      // Get attendance data (mocked for now)
      // In a real app, you would fetch actual attendance data
      const attendanceRate = Math.round(Math.random() * 30) + 70; // 70-100%
      
      return {
        id: classroom.id,
        name: classroom.name,
        description: classroom.description,
        studentCount: classroom._count.students,
        assignmentCount: classroom._count.assignments,
        averageScore,
        attendanceRate
      };
    });
    
    res.status(200).json({ classrooms: classroomStats });
  } catch (error) {
    console.error('Get classroom analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get student analytics data (admin or teacher-specific)
export const getStudentAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { classroom, dateFrom, dateTo } = req.query;
    
    // Parse dates if provided
    const fromDate = dateFrom ? new Date(dateFrom as string) : undefined;
    const toDate = dateTo ? new Date(dateTo as string) : undefined;
    
    let studentData;
    
    // Admin can see all students or students in a specific classroom
    if (userRole === 'ADMIN') {
      studentData = await prisma.user.findMany({
        where: {
          role: UserRole.STUDENT,
          isActive: true,
          // Filter by classroom if specified
          ...(classroom ? {
            studentClassrooms: {
              some: {
                classroomId: classroom as string
              }
            }
          } : {})
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          studentAssignments: {
            where: {
              ...(fromDate && toDate ? {
                assignment: {
                  createdAt: {
                    gte: fromDate,
                    lte: toDate
                  }
                }
              } : {})
            },
            select: {
              id: true,
              status: true,
              grade: true,
              submittedAt: true,
              assignment: {
                select: {
                  id: true,
                  title: true,
                  dueDate: true,
                  classroom: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      });
    } 
    // Teachers can only see students in their classrooms
    else if (userRole === 'TEACHER') {
      // Get classrooms where the teacher is assigned
      const teacherClassrooms = await prisma.classroomTeacher.findMany({
        where: {
          teacherId: userId
        },
        select: {
          classroomId: true
        }
      });
      
      const classroomIds = teacherClassrooms.map(tc => tc.classroomId);
      
      // Filter by specific classroom if provided and teacher has access
      if (classroom && !classroomIds.includes(classroom as string)) {
        return res.status(403).json({ message: 'Not authorized to access this classroom' });
      }
      
      studentData = await prisma.user.findMany({
        where: {
          role: UserRole.STUDENT,
          isActive: true,
          studentClassrooms: {
            some: {
              classroomId: classroom ? classroom as string : {
                in: classroomIds
              }
            }
          }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          studentAssignments: {
            where: {
              ...(fromDate && toDate ? {
                assignment: {
                  createdAt: {
                    gte: fromDate,
                    lte: toDate
                  }
                }
              } : {}),
              assignment: {
                classroom: {
                  id: classroom ? classroom as string : {
                    in: classroomIds
                  }
                }
              }
            },
            select: {
              id: true,
              status: true,
              grade: true,
              submittedAt: true,
              assignment: {
                select: {
                  id: true,
                  title: true,
                  dueDate: true,
                  classroom: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      });
    } else {
      return res.status(403).json({ message: 'Not authorized to access this resource' });
    }
    
    // Format student performance data
    const students = studentData.map(student => {
      // Calculate average score
      let totalScore = 0;
      let totalGradedAssignments = 0;
      
      student.studentAssignments.forEach(assignment => {
        if (assignment.grade !== null) {
          totalScore += assignment.grade;
          totalGradedAssignments++;
        }
      });
      
      const averageScore = totalGradedAssignments > 0 
        ? Math.round((totalScore / totalGradedAssignments) * 100) / 100
        : 0;
        
      // Count completed and pending assignments
      const assignmentsCompleted = student.studentAssignments.filter(
        a => a.status === 'COMPLETED'
      ).length;
      
      const assignmentsPending = student.studentAssignments.filter(
        a => a.status === 'PENDING'
      ).length;
      
      // Get attendance data (mocked for now)
      // In a real app, you would fetch actual attendance data
      const attendanceRate = Math.round(Math.random() * 20) + 80; // 80-100%
      
      // Generate performance trend data (mocked for now)
      // In a real app, you would aggregate actual scores over time
      const trend = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (5 - i) * 7); // Weekly data points
        
        return {
          date: `Week ${i + 1}`,
          score: Math.round(
            ((averageScore - 10) + Math.random() * 20)
          ) // Score with some random variation
        };
      });
      
      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        averageScore,
        assignmentsCompleted,
        assignmentsPending,
        attendanceRate,
        trend
      };
    });
    
    res.status(200).json({ students });
  } catch (error) {
    console.error('Get student analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get teacher analytics data (admin only)
export const getTeacherAnalytics = async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    const { dateFrom, dateTo } = req.query;
    
    // Only admin can access teacher analytics
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to access this resource' });
    }
    
    // Parse dates if provided
    const fromDate = dateFrom ? new Date(dateFrom as string) : undefined;
    const toDate = dateTo ? new Date(dateTo as string) : undefined;
    
    // Get all teachers with their classrooms
    const teacherData = await prisma.user.findMany({
      where: {
        role: UserRole.TEACHER,
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        teacherClassrooms: {
          select: {
            classroom: {
              select: {
                id: true,
                name: true,
                _count: {
                  select: {
                    students: true
                  }
                },
                assignments: {
                  where: {
                    ...(fromDate && toDate ? {
                      createdAt: {
                        gte: fromDate,
                        lte: toDate
                      }
                    } : {})
                  },
                  select: {
                    id: true,
                    students: {
                      select: {
                        grade: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    
    // Format teacher effectiveness data
    const teachers = teacherData.map(teacher => {
      const classrooms = teacher.teacherClassrooms.map(tc => {
        let totalScore = 0;
        let totalGradedAssignments = 0;
        
        tc.classroom.assignments.forEach(assignment => {
          assignment.students.forEach(studentAssignment => {
            if (studentAssignment.grade !== null) {
              totalScore += studentAssignment.grade;
              totalGradedAssignments++;
            }
          });
        });
        
        const averageScore = totalGradedAssignments > 0 
          ? Math.round((totalScore / totalGradedAssignments) * 100) / 100
          : 0;
          
        return {
          id: tc.classroom.id,
          name: tc.classroom.name,
          studentCount: tc.classroom._count.students,
          averageScore
        };
      });
      
      // Calculate overall metrics
      const totalStudents = classrooms.reduce((sum, c) => sum + c.studentCount, 0);
      const weightedScoreSum = classrooms.reduce(
        (sum, c) => sum + (c.averageScore * c.studentCount), 0
      );
      
      const averageClassScore = totalStudents > 0
        ? Math.round((weightedScoreSum / totalStudents) * 100) / 100
        : 0;
      
      return {
        id: teacher.id,
        name: `${teacher.firstName} ${teacher.lastName}`,
        classroomCount: classrooms.length,
        studentCount: totalStudents,
        averageClassScore,
        classrooms
      };
    });
    
    res.status(200).json({ teachers });
  } catch (error) {
    console.error('Get teacher analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get classroom analytics for a specific teacher
export const getTeacherClassroomAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { dateFrom, dateTo } = req.query;
    
    // Only teachers or admins can access this
    if (userRole !== 'TEACHER' && userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to access this resource' });
    }
    
    // Parse dates if provided
    const fromDate = dateFrom ? new Date(dateFrom as string) : undefined;
    const toDate = dateTo ? new Date(dateTo as string) : undefined;
    
    // Get classrooms where the teacher is assigned
    const teacherClassrooms = await prisma.classroomTeacher.findMany({
      where: {
        teacherId: userId
      },
      select: {
        classroom: {
          select: {
            id: true,
            name: true,
            description: true,
            _count: {
              select: {
                students: true,
                assignments: true
              }
            },
            assignments: {
              where: {
                ...(fromDate && toDate ? {
                  createdAt: {
                    gte: fromDate,
                    lte: toDate
                  }
                } : {})
              },
              select: {
                id: true,
                students: {
                  select: {
                    grade: true,
                    status: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    // Calculate metrics for each classroom
    const classroomStats = teacherClassrooms.map(tc => {
      const classroom = tc.classroom;
      
      // Calculate average score
      let totalScore = 0;
      let totalGradedAssignments = 0;
      
      classroom.assignments.forEach(assignment => {
        assignment.students.forEach(studentAssignment => {
          if (studentAssignment.grade !== null) {
            totalScore += studentAssignment.grade;
            totalGradedAssignments++;
          }
        });
      });
      
      const averageScore = totalGradedAssignments > 0 
        ? Math.round((totalScore / totalGradedAssignments) * 100) / 100
        : 0;
        
      // Get attendance data (mocked for now)
      const attendanceRate = Math.round(Math.random() * 30) + 70; // 70-100%
      
      return {
        id: classroom.id,
        name: classroom.name,
        description: classroom.description,
        studentCount: classroom._count.students,
        assignmentCount: classroom._count.assignments,
        averageScore,
        attendanceRate
      };
    });
    
    res.status(200).json({ classrooms: classroomStats });
  } catch (error) {
    console.error('Get teacher classroom analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get student analytics for a specific teacher
export const getTeacherStudentAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { classroom, dateFrom, dateTo } = req.query;
    
    // Only teachers or admins can access this
    if (userRole !== 'TEACHER' && userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to access this resource' });
    }
    
    // Parse dates if provided
    const fromDate = dateFrom ? new Date(dateFrom as string) : undefined;
    const toDate = dateTo ? new Date(dateTo as string) : undefined;
    
    // Get classrooms where the teacher is assigned
    const teacherClassrooms = await prisma.classroomTeacher.findMany({
      where: {
        teacherId: userId
      },
      select: {
        classroomId: true
      }
    });
    
    const classroomIds = teacherClassrooms.map(tc => tc.classroomId);
    
    // Filter by specific classroom if provided and teacher has access
    if (classroom && !classroomIds.includes(classroom as string)) {
      return res.status(403).json({ message: 'Not authorized to access this classroom' });
    }
    
    // Get students in the teacher's classrooms
    const studentData = await prisma.user.findMany({
      where: {
        role: UserRole.STUDENT,
        isActive: true,
        studentClassrooms: {
          some: {
            classroomId: classroom ? classroom as string : {
              in: classroomIds
            }
          }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        studentAssignments: {
          where: {
            ...(fromDate && toDate ? {
              assignment: {
                createdAt: {
                  gte: fromDate,
                  lte: toDate
                }
              }
            } : {}),
            assignment: {
              classroom: {
                id: classroom ? classroom as string : {
                  in: classroomIds
                }
              }
            }
          },
          select: {
            id: true,
            status: true,
            grade: true,
            submittedAt: true,
            assignment: {
              select: {
                id: true,
                title: true,
                dueDate: true,
                classroom: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    // Format student performance data
    const students = studentData.map(student => {
      // Calculate average score
      let totalScore = 0;
      let totalGradedAssignments = 0;
      
      student.studentAssignments.forEach(assignment => {
        if (assignment.grade !== null) {
          totalScore += assignment.grade;
          totalGradedAssignments++;
        }
      });
      
      const averageScore = totalGradedAssignments > 0 
        ? Math.round((totalScore / totalGradedAssignments) * 100) / 100
        : 0;
        
      // Count completed and pending assignments
      const assignmentsCompleted = student.studentAssignments.filter(
        a => a.status === 'COMPLETED'
      ).length;
      
      const assignmentsPending = student.studentAssignments.filter(
        a => a.status === 'PENDING'
      ).length;
      
      // Get attendance data (mocked for now)
      const attendanceRate = Math.round(Math.random() * 20) + 80; // 80-100%
      
      // Generate performance trend data (mocked for now)
      const trend = Array.from({ length: 6 }, (_, i) => {
        return {
          date: `Week ${i + 1}`,
          score: Math.round(
            ((averageScore - 10) + Math.random() * 20)
          ) // Score with some random variation
        };
      });
      
      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        averageScore,
        assignmentsCompleted,
        assignmentsPending,
        attendanceRate,
        trend
      };
    });
    
    res.status(200).json({ students });
  } catch (error) {
    console.error('Get teacher student analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};