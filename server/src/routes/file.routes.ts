// server/src/routes/file.routes.ts
import express from 'express';
import { getFile, deleteFile } from '../controllers/file.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// File routes
router.get('/:id', getFile);
router.delete('/:id', deleteFile);

export default router;