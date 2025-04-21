import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';

export const validateResetToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resetToken } = req.params;

    console.log('Middleware - Reset Token Validation');
    console.log('Received Reset Token:', resetToken);
    console.log('Current Timestamp:', new Date());

    // Comprehensive token validation logging
    const tokenValidationCheck = await prisma.user.findFirst({
      where: {
        resetToken: resetToken,
        resetTokenExpiry: { gt: new Date() }
      },
      select: {
        id: true,
        email: true,
        resetToken: true,
        resetTokenExpiry: true
      }
    });

    console.log('Token Validation Check Result:');
    console.log('User Found:', tokenValidationCheck ? 'Yes' : 'No');
    
    if (tokenValidationCheck) {
      console.log('User ID:', tokenValidationCheck.id);
      console.log('User Email:', tokenValidationCheck.email);
      console.log('Stored Token:', tokenValidationCheck.resetToken);
      console.log('Token Expiry:', tokenValidationCheck.resetTokenExpiry);
      
      // Attach user info to request for further processing
      req.resetUser = tokenValidationCheck;
      
      next();
    } else {
      // Fetch all users with active reset tokens for additional context
      const allActiveTokenUsers = await prisma.user.findMany({
        where: {
          resetToken: { not: null },
          resetTokenExpiry: { gt: new Date() }
        },
        select: {
          id: true,
          email: true,
          resetToken: true,
          resetTokenExpiry: true
        }
      });

      console.log('All Users with Active Reset Tokens:');
      console.log(JSON.stringify(allActiveTokenUsers, null, 2));

      return res.status(400).json({ 
        message: 'Invalid or expired reset token',
        details: {
          tokenLength: resetToken.length,
          activeTokens: allActiveTokenUsers.length,
          activeTokenEmails: allActiveTokenUsers.map(u => u.email)
        }
      });
    }
  } catch (error) {
    console.error('Reset Token Validation Middleware Error:', error);
    res.status(500).json({ message: 'Server error during token validation' });
  }
};