// server/src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../index';
import { UserRole } from '@prisma/client';
import nodemailer from 'nodemailer';

// Login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // console.log(`Login attempt for email: ${email}`);
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      // console.log(`User not found for email: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // console.log(`User found: ${user.id}, checking password...`);
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      // console.log('Password did not match');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // console.log('Password matched, generating token...');
    
    // Create token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'default_secret_for_development',
      { expiresIn: '7d' }
    );
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    // console.log('Login successful, sending response');
    
    res.status(200).json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Register user
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Validate role
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role provided' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role as UserRole
      }
    });

    // Create token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current user
export const getMe = async (req: Request, res: Response) => {
  try {
    // User ID should be set in middleware
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        isActive: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const sendPasswordResetEmail = async (email: string, resetUrl: string) => {
  const transporter = createTransporter();

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL, // sender address
      to: email, // list of receivers
      subject: "Password Reset Request", // Subject line
      text: `
        You have requested a password reset. 
        Please click the following link to reset your password:
        ${resetUrl}
        
        If you did not request a password reset, please ignore this email.
        This link will expire in 1 hour.
      `, // plain text body
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You have requested a password reset. Please click the button below to reset your password:</p>
          <p>
            <a href="${resetUrl}" style="
              display: inline-block; 
              padding: 10px 20px; 
              background-color: #4CAF50; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px;
            ">Reset Password</a>
          </p>
          <p style="color: #666;">
            If you did not request a password reset, please ignore this email.
            This link will expire in 1 hour.
          </p>
        </div>
      ` // html body
    });
    
    // console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    console.log('Forgot Password Request');
    console.log('Received Email:', email);
    console.log('Timestamp:', new Date().toISOString());

    // Find user by email
    const user = await prisma.user.findUnique({ 
      where: { email },
      select: {
        id: true,
        email: true,
        resetToken: true,
        resetTokenExpiry: true
      }
    });

    // If no user found, return generic success message
    if (!user) {
      return res.status(200).json({ 
        message: 'If a user with that email exists, a reset link has been sent' 
      });
    }

    // Check if there's an existing valid reset token
    const existingToken = user.resetToken;
    const existingTokenExpiry = user.resetTokenExpiry;

    let resetToken: string;
    let resetTokenExpiry: Date;

    // If existing token is still valid, use it
    if (existingToken && existingTokenExpiry && existingTokenExpiry > new Date()) {
      console.log('Using Existing Valid Reset Token');
      resetToken = existingToken;
      resetTokenExpiry = existingTokenExpiry;
    } else {
      // Generate a new token
      console.log('Generating New Reset Token');
      resetToken = crypto.randomBytes(32).toString('hex');
      resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    }

    // Log token details
    console.log('Reset Token:', resetToken);
    console.log('Token Expiry:', resetTokenExpiry.toISOString());

    // Update user with reset token
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { 
        resetToken: resetToken,
        resetTokenExpiry: resetTokenExpiry 
      },
      select: {
        id: true,
        email: true,
        resetToken: true,
        resetTokenExpiry: true
      }
    });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    console.log('Reset URL:', resetUrl);

    // Send password reset email
    await sendPasswordResetEmail(email, resetUrl);

    res.status(200).json({ 
      message: 'If a user with that email exists, a reset link has been sent',
      debugInfo: {
        tokenLength: resetToken.length,
        tokenGenerated: resetToken !== existingToken
      }
    });
  } catch (error) {
    console.error('Detailed Forgot Password Error:', error);
    res.status(500).json({ message: 'Server error during password reset request' });
  }
};

// Reset Password Function
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { resetToken } = req.params;
    const { password } = req.body;

    // Extensive logging for reset password attempt
    console.log('Reset Password Attempt');
    console.log('Received Reset Token:', resetToken);
    console.log('Token Length:', resetToken.length);
    console.log('Current Timestamp:', new Date().toISOString());

    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Find user with matching reset token that hasn't expired
    const user = await prisma.user.findFirst({
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

    // Log user and token verification details
    console.log('Token Verification:');
    console.log('User Found:', user ? 'Yes' : 'No');
    
    if (!user) {
      // Fetch all users with active reset tokens for debugging
      const allUsersWithResetTokens = await prisma.user.findMany({
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

      console.log('Active Reset Tokens:');
      console.log(JSON.stringify(allUsersWithResetTokens, null, 2));

      return res.status(400).json({ 
        message: 'Invalid or expired reset token',
        details: {
          tokenLength: resetToken.length,
          activeTokensCount: allUsersWithResetTokens.length
        }
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user's password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      }
    });

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Detailed Reset Password Error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};

// Debug route to check reset tokens
export const debugResetTokens = async (req: Request, res: Response) => {
  try {
    const allUsersWithResetTokens = await prisma.user.findMany({
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

    res.status(200).json({
      message: 'Active reset tokens',
      tokens: allUsersWithResetTokens.map(user => ({
        id: user.id,
        email: user.email,
        tokenLength: user.resetToken?.length,
        tokenExpiry: user.resetTokenExpiry
      }))
    });
  } catch (error) {
    console.error('Debug Tokens Error:', error);
    res.status(500).json({ message: 'Error fetching reset tokens' });
  }
};
export const registerStudent = (req: Request, res: Response) => {
  // Implementation will be added later
  res.status(200).json({ message: 'Register student endpoint' });
};