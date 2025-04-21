// server/src/middleware/role.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

export const roleMiddleware = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        console.log('Role middleware: No user in request');
        return res.status(401).json({ message: 'Not authorized' });
      }

      const userRole = req.user.role;
      console.log(`Role check: User role ${userRole}, allowed roles: ${allowedRoles.join(', ')}`);

      if (!allowedRoles.includes(userRole as UserRole)) {
        console.log(`Role check failed: User role ${userRole} not in allowed roles`);
        return res.status(403).json({ 
          message: 'You do not have permission to perform this action',
          requiredRoles: allowedRoles,
          userRole: userRole
        });
      }

      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  };
};