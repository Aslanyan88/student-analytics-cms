// server/src/routes/classroom.routes.ts
import express from 'express';
import { body } from 'express-validator';
import {
  getAllClassrooms,
  getClassroom,
  createClassroom,
  updateClassroom,
  deleteClassroom,
  addTeacherToClassroom,
  addStudentToClassroom,
  removeTeacherFromClassroom,
  removeStudentFromClassroom
} from '../controllers/classtoom.controller';
import { authMiddleware, restrictTo } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.midlware';
import { UserRole } from '@prisma/client';

const router = express.Router();

// Validation
const createClassroomValidation = [
  body('name').notEmpty().withMessage('Classroom name is required'),
  body('description').optional()
];

const updateClassroomValidation = [
  body('name').optional(),
  body('description').optional(),
  body('isActive').optional().isBoolean()
];

const addTeacherValidation = [
  body('teacherId').optional(),
  body('teacherEmail').optional().isEmail().withMessage('Valid teacher email is required')
];

const addStudentValidation = [
  body('studentId').optional(),
  body('studentEmail').optional().isEmail().withMessage('Valid student email is required')
];

// Protect all routes
router.use(authMiddleware);

// Get all classrooms - accessible by all authenticated users
router.get('/', getAllClassrooms);

// Get single classroom - accessible by all authenticated users
router.get('/:id', getClassroom);

// Create classroom - restricted to admin and teachers
router.post(
  '/',
  restrictTo(UserRole.ADMIN, UserRole.TEACHER),
  createClassroomValidation,
  validateRequest,
  createClassroom
);

// Update classroom - restricted to admin and classroom creator
router.put(
  '/:id',
  restrictTo(UserRole.ADMIN, UserRole.TEACHER),
  updateClassroomValidation,
  validateRequest,
  updateClassroom
);

// Delete classroom - restricted to admin and classroom creator
router.delete(
  '/:id',
  restrictTo(UserRole.ADMIN, UserRole.TEACHER),
  deleteClassroom
);

// Add teacher to classroom - restricted to admin and classroom creator
router.post(
  '/:classroomId/teachers',
  restrictTo(UserRole.ADMIN, UserRole.TEACHER),
  addTeacherValidation,
  validateRequest,
  addTeacherToClassroom
);

// Add student to classroom - restricted to admin and teachers
router.post(
  '/:classroomId/students',
  restrictTo(UserRole.ADMIN, UserRole.TEACHER),
  addStudentValidation,
  validateRequest,
  addStudentToClassroom
);

// Remove teacher from classroom - restricted to admin and classroom creator
router.delete(
  '/:classroomId/teachers/:teacherId',
  restrictTo(UserRole.ADMIN, UserRole.TEACHER),
  removeTeacherFromClassroom
);

// Remove student from classroom - restricted to admin and teachers
router.delete(
  '/:classroomId/students/:studentId',
  restrictTo(UserRole.ADMIN, UserRole.TEACHER),
  removeStudentFromClassroom
);

export default router;