// server/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import classroomRoutes from './routes/classroom.routes';
import analyticsRoutes from './routes/activityLog.routes';
import usersRoutes from './routes/user.routes';
import studentRoutes from './routes/student.routes'
import teacherRoutes from './routes/teacher.routes'

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Prisma client
export const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration - this should come BEFORE route definitions
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Routes - these should come AFTER CORS setup
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', usersRoutes); // Moved this down after CORS setup
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // In production, you might want to exit the process
  process.exit(1);
});