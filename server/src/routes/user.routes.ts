// server/src/routes/user.routes.ts
import express from 'express';
import { 
  searchUsers,
  searchUsersConsistent,
  getAllUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser,
  getAllUsersByRole
} from '../controllers/user.contoller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import { UserRole } from '@prisma/client';

const router = express.Router();

// Apply auth middleware to all user routes
router.use(authMiddleware);

// Search and role-based listing endpoints
router.get('/search', searchUsers);
router.get('/search-consistent', searchUsersConsistent);
router.get('/all', getAllUsersByRole);

// Admin-only routes
router.get('/', roleMiddleware([UserRole.ADMIN]), getAllUsers);
router.post('/', roleMiddleware([UserRole.ADMIN]), createUser);
router.get('/:id', roleMiddleware([UserRole.ADMIN]), getUserById);
router.put('/:id', roleMiddleware([UserRole.ADMIN]), updateUser);
router.delete('/:id', roleMiddleware([UserRole.ADMIN]), deleteUser);

export default router;