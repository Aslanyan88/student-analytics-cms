import { Request, Response } from 'express';
import { prisma } from '../index';
import { UserRole } from '@prisma/client';
// Get dashboard statistics for admin
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Get total users count
    const totalUsers = await prisma.user.count({
      where: { isActive: true }
    });

    // Get teachers count
    const totalTeachers = await prisma.user.count({
      where: { role: UserRole.TEACHER, isActive: true }
    });

    // Get students count
    const totalStudents = await prisma.user.count({
      where: { role: UserRole.STUDENT, isActive: true }
    });

    // Get classrooms count
    const totalClassrooms = await prisma.classroom.count({
      where: { isActive: true }
    });

    // Get active assignments count
    const activeAssignments = await prisma.assignment.count({
      where: {
        isActive: true,
        dueDate: {
          gte: new Date()
        }
      }
    });

    
    // Get recent classroom creations
    const recentClassrooms = await prisma.classroom.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Get recent teacher assignments
    const recentTeacherAssignments = await prisma.classroomTeacher.findMany({
      select: {
        id: true,
        assignedAt: true,
        classroom: {
          select: {
            id: true,
            name: true
          }
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { assignedAt: 'desc' },
      take: 5
    });

    // Get recent student enrollments
    const recentStudentEnrollments = await prisma.classroomStudent.findMany({
      select: {
        id: true,
        assignedAt: true,
        classroom: {
          select: {
            id: true,
            name: true
          }
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { assignedAt: 'desc' },
      take: 5
    });

    // Get recent assignments
    const recentAssignments = await prisma.assignment.findMany({
      select: {
        id: true,
        title: true,
        createdAt: true,
        classroom: {
          select: {
            id: true,
            name: true
          }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Combine and format activities
    const recentActivities = [
      ...recentClassrooms.map(classroom => ({
        id: `classroom-${classroom.id}`,
        type: 'classroom_created',
        description: `New classroom "${classroom.name}" created`,
        timestamp: classroom.createdAt.toISOString(),
        user: {
          id: classroom.creator.id,
          name: `${classroom.creator.firstName} ${classroom.creator.lastName}`
        }
      })),
      ...recentTeacherAssignments.map(assignment => ({
        id: `teacher-${assignment.id}`,
        type: 'teacher_assigned',
        description: `Teacher assigned to ${assignment.classroom.name}`,
        timestamp: assignment.assignedAt.toISOString(),
        user: {
          id: assignment.teacher.id,
          name: `${assignment.teacher.firstName} ${assignment.teacher.lastName}`
        }
      })),
      ...recentStudentEnrollments.map(enrollment => ({
        id: `student-${enrollment.id}`,
        type: 'student_enrolled',
        description: `Student enrolled in ${enrollment.classroom.name}`,
        timestamp: enrollment.assignedAt.toISOString(),
        user: {
          id: enrollment.student.id,
          name: `${enrollment.student.firstName} ${enrollment.student.lastName}`
        }
      })),
      ...recentAssignments.map(assignment => ({
        id: `assignment-${assignment.id}`,
        type: 'assignment_created',
        description: `Assignment "${assignment.title}" created in ${assignment.classroom.name}`,
        timestamp: assignment.createdAt.toISOString(),
        user: {
          id: assignment.creator.id,
          name: `${assignment.creator.firstName} ${assignment.creator.lastName}`
        }
      }))
    ]
    // Sort by timestamp (most recent first)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    // Limit to 10 most recent activities
    .slice(0, 10);

    // Return the dashboard statistics
    res.status(200).json({
      totalUsers,
      totalTeachers,
      totalStudents,
      totalClassrooms,
      activeAssignments,
      recentActivities
    });
  } catch (error) {
    console.error('Get admin dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get system statistics
export const getSystemStats = async (req: Request, res: Response) => {
  try {
    // Get total users registered (admin/teacher/student)
    const userCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true
      },
      where: {
        isActive: true
      }
    });

    // Get classroom statistics
    const classroomStats = await prisma.$queryRaw`
      SELECT 
        COUNT(DISTINCT c.id) as total_classrooms,
        AVG(student_count.count) as avg_students_per_classroom
      FROM classrooms c
      LEFT JOIN (
        SELECT classroom_id, COUNT(*) as count
        FROM classroom_students
        GROUP BY classroom_id
      ) student_count ON c.id = student_count.classroom_id
      WHERE c.is_active = 1
    `;

    // Get assignment statistics
    const assignmentStats = await prisma.$queryRaw`
      SELECT
        COUNT(*) as total_assignments,
        SUM(CASE WHEN due_date >= NOW() THEN 1 ELSE 0 END) as active_assignments,
        AVG(completion_rate.rate) as avg_completion_rate
      FROM assignments a
      LEFT JOIN (
        SELECT 
          assignment_id, 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
          (SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) / COUNT(*)) * 100 as rate
        FROM student_assignments
        GROUP BY assignment_id
      ) completion_rate ON a.id = completion_rate.assignment_id
      WHERE a.is_active = 1
    `;

    // Get performance statistics
    const performanceStats = await prisma.$queryRaw`
      SELECT
        AVG(performance_score) as avg_performance_score,
        MIN(performance_score) as min_performance_score,
        MAX(performance_score) as max_performance_score
      FROM activity_logs
      WHERE performance_score IS NOT NULL
    `;

    // Get attendance statistics
    const attendanceStats = await prisma.$queryRaw`
      SELECT
        COUNT(*) as total_records,
        SUM(CASE WHEN is_present = 1 THEN 1 ELSE 0 END) as present_count,
        (SUM(CASE WHEN is_present = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100 as attendance_rate
      FROM activity_logs
      WHERE is_present IS NOT NULL
    `;

    res.status(200).json({
      users: userCounts,
      classrooms: classroomStats[0],
      assignments: assignmentStats[0],
      performance: performanceStats[0],
      attendance: attendanceStats[0]
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};