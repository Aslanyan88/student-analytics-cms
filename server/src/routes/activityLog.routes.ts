// server/src/routes/analytics.routes.ts
import express from 'express';
import {
  getClassroomAnalytics,
  getStudentAnalytics,
  getTeacherAnalytics,
  getTeacherClassroomAnalytics,
  getTeacherStudentAnalytics
} from '../controllers/analytics.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import { UserRole } from '@prisma/client';

const router = express.Router();

// Apply auth middleware to all analytics routes
router.use(authMiddleware);

// Admin-only routes
router.get('/classrooms', roleMiddleware([UserRole.ADMIN]), getClassroomAnalytics);
router.get('/students', roleMiddleware([UserRole.ADMIN]), getStudentAnalytics);
router.get('/teachers', roleMiddleware([UserRole.ADMIN]), getTeacherAnalytics);

// Teacher routes (admin can also access)
router.get('/teacher/classrooms', roleMiddleware([UserRole.ADMIN, UserRole.TEACHER]), getTeacherClassroomAnalytics);
router.get('/teacher/students', roleMiddleware([UserRole.ADMIN, UserRole.TEACHER]), getTeacherStudentAnalytics);

export default router;