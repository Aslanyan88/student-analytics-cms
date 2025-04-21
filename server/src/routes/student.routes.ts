// server/src/routes/student.routes.ts
import express from 'express';
import { 
  getStudentClassrooms, 
  getClassroomDetails,
  getStudentAssignments 
} from '../controllers/student.controller';
import { 
  getStudentAssignment,
  submitStudentAssignment,
  upload,
  getStudentDashboardStats
} from '../controllers/student.assignment.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import { UserRole } from '@prisma/client';

const router = express.Router();

// Apply auth middleware to all student routes
router.use(authMiddleware);
// Ensure only students or admins can access these routes
router.use(roleMiddleware([UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN]));

// Dashboard stats
router.get('/dashboard-stats', getStudentDashboardStats);

// Classroom routes
router.get('/classrooms', getStudentClassrooms);
router.get('/classrooms/:classroomId', getClassroomDetails);

// Assignment routes
router.get('/assignments', getStudentAssignments);
router.get('/assignments/:id', getStudentAssignment);
router.post('/assignments/:id/submit', upload.array('files', 10), submitStudentAssignment);

export default router;