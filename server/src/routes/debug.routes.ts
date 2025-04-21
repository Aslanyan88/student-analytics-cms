// Create a file at server/src/routes/debug.routes.ts
import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Apply auth middleware to debug routes
router.use(authMiddleware);

// Add debug routes here if needed
router.get('/test', (req, res) => {
  res.status(200).json({ message: 'Debug endpoint working' });
});

export default router;