import express from 'express';
import { body, param } from 'express-validator';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.midlware';
import { UserRole } from '@prisma/client';

const router = express.Router();


const getAllAssignments = (req: express.Request, res: express.Response) => {
  res.status(200).json({ message: 'Get all assignments endpoint' });
};

const getAssignment = (req: express.Request, res: express.Response) => {
  res.status(200).json({ message: `Get assignment with ID: ${req.params.id}` });
};

const createAssignment = (req: express.Request, res: express.Response) => {
  res.status(201).json({ message: 'Create assignment endpoint', data: req.body });
};

const updateAssignment = (req: express.Request, res: express.Response) => {
  res.status(200).json({ message: `Update assignment with ID: ${req.params.id}`, data: req.body });
};

const deleteAssignment = (req: express.Request, res: express.Response) => {
  res.status(200).json({ message: `Delete assignment with ID: ${req.params.id}` });
};

const submitAssignment = (req: express.Request, res: express.Response) => {
  res.status(200).json({ message: `Submit assignment with ID: ${req.params.id}`, data: req.body });
};

const gradeAssignment = (req: express.Request, res: express.Response) => {
  res.status(200).json({ message: `Grade assignment with ID: ${req.params.id}`, data: req.body });
};

// Validation schemas
const createAssignmentValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('classroomId').notEmpty().withMessage('Classroom ID is required'),
  body('dueDate').optional().isISO8601().withMessage('Due date must be a valid date'),
  body('description').optional(),
  body('isClassWide').optional().isBoolean().withMessage('isClassWide must be a boolean'),
];

const updateAssignmentValidation = [
  body('title').optional(),
  body('dueDate').optional().isISO8601().withMessage('Due date must be a valid date'),
  body('description').optional(),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

const submitAssignmentValidation = [
  body('content').notEmpty().withMessage('Submission content is required'),
];

const gradeAssignmentValidation = [
  body('grade').isFloat({ min: 0, max: 100 }).withMessage('Grade must be between 0 and 100'),
  body('feedback').optional(),
];

// Protect all routes
router.use(protect);

// Get all assignments (available to all authenticated users, but filtered by role)
router.get('/', getAllAssignments);

// Get single assignment
router.get('/:id', getAssignment);

// Create assignment (only teachers and admins)
router.post(
  '/',
  restrictTo(UserRole.ADMIN, UserRole.TEACHER),
  createAssignmentValidation,
  validateRequest,
  createAssignment
);

// Update assignment (only creator or admin)
router.put(
  '/:id',
  restrictTo(UserRole.ADMIN, UserRole.TEACHER),
  updateAssignmentValidation,
  validateRequest,
  updateAssignment
);

// Delete assignment (only creator or admin)
router.delete(
  '/:id',
  restrictTo(UserRole.ADMIN, UserRole.TEACHER),
  deleteAssignment
);

// Submit assignment (only students)
router.post(
  '/:id/submit',
  restrictTo(UserRole.STUDENT),
  submitAssignmentValidation,
  validateRequest,
  submitAssignment
);

// Grade assignment (only teachers and admins)
router.put(
  '/:id/grade',
  restrictTo(UserRole.ADMIN, UserRole.TEACHER),
  param('id').notEmpty().withMessage('Assignment ID is required'),
  body('studentId').notEmpty().withMessage('Student ID is required'),
  gradeAssignmentValidation,
  validateRequest,
  gradeAssignment
);

export default router;