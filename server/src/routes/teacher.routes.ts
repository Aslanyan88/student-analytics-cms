import express from 'express';
import {
  getTeacherClassrooms,
  getClassroomDetails,
  getClassroomStudents,
  getClassroomAssignments,
  getAllAssignments,
  getAssignmentDetails,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAttendance,
  submitAttendance,
  getAnalytics,
  sendReminderEmails, 
  getSubmissionDetail,
  updateSubmission
} from '../controllers/teacher.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import { UserRole } from '@prisma/client';

const router = express.Router();

// Apply auth middleware to all teacher routes
router.use(authMiddleware);
// Ensure only teachers or admins can access these routes
router.use(roleMiddleware([UserRole.TEACHER, UserRole.ADMIN]));

// Classrooms
router.get('/classrooms', getTeacherClassrooms);
router.get('/classrooms/:id', getClassroomDetails);
router.get('/classrooms/:id/students', getClassroomStudents);
router.get('/classrooms/:id/assignments', getClassroomAssignments);

// Assignments
router.get('/assignments', getAllAssignments);
router.get('/assignments/:id', getAssignmentDetails);
router.post('/assignments', createAssignment);
router.put('/assignments/:id', updateAssignment);
router.delete('/assignments/:id', deleteAssignment); // Add this line
router.post('/assignments/:id/send-reminders', sendReminderEmails);
router.get('/submissions/:id', getSubmissionDetail);
router.put('/submissions/:id', updateSubmission);

// Attendance
router.get('/attendance/:classroomId', getAttendance);
router.post('/attendance/:classroomId', submitAttendance);

// Analytics
router.get('/analytics/:classroomId', getAnalytics);

export default router;