// server/src/controllers/notification.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../index';

// Get notifications for the current user
export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        receiverId: userId,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Limit to 20 most recent notifications
    });

    res.status(200).json({ notifications });
  } catch (error) {
    console.error('Get user notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Check if notification exists and belongs to the user
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        receiverId: userId
      }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Update notification status
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.status(200).json({ notification: updatedNotification });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    // Update all user's unread notifications
    await prisma.notification.updateMany({
      where: {
        receiverId: userId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a notification (internal function, not exposed as API)
export const createNotification = async (
  senderId: string,
  receiverId: string,
  title: string,
  message: string
) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        senderId,
        receiverId
      }
    });

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};