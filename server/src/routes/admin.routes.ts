// server/src/routes/admin.routes.ts
import express from 'express';
import { getDashboardStats, getSystemStats } from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import { UserRole } from '@prisma/client';

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(authMiddleware);
// Ensure only admins can access these routes
router.use(roleMiddleware([UserRole.ADMIN]));

// Admin dashboard stats
router.get('/dashboard-stats', getDashboardStats);

// System statistics
router.get('/system-stats', getSystemStats);

export default router;

