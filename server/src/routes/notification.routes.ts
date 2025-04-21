// server/src/routes/notification.routes.ts
import express from 'express';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Protect all routes
router.use(authMiddleware);

// Get all notifications for the current user
router.get('/', getUserNotifications);

// Mark a notification as read
router.put('/:id/read', markNotificationAsRead);

// Mark all notifications as read
router.put('/read-all', markAllNotificationsAsRead);

export default router;