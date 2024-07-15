import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { ChessVerificationService } from '../services/chessVerificationService';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';
import { createOrUpdateChessInfo } from '../services/chessInfoService';
import winston from 'winston';

const prisma = new PrismaClient();

export class AuthController {
  private authService: AuthService;
  private chessVerificationService: ChessVerificationService;

  constructor() {
    this.authService = new AuthService();
    this.chessVerificationService = new ChessVerificationService();
  }

  public initiateChessVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { chessUsername } = req.body;
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      const isValid = await this.chessVerificationService.isValidChessComId(chessUsername);
      if (!isValid) {
        res.status(400).json({ error: 'Invalid Chess.com username' });
        return;
      }
      const verificationCode = token;
      res.json({ verificationCode });
    } catch (error) {
      next(error);
    }
  };

  public confirmChessVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { chessUsername } = req.body;
      const trimmedChessUsername = chessUsername.trim(); // Trim the username
      const user = req.user as User;
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!user) {
        res.status(400).json({ error: 'User not found' });
        return;
      }

      // Check if the Chess.com ID is already linked to another user
      const existingUser = await prisma.user.findUnique({ where: { chessUsername: trimmedChessUsername } });
      if (existingUser && existingUser.id !== user.id) {
        res.status(400).json({ error: 'Chess.com ID is already linked to another account' });
        return;
      }

      let verificationCode: string | undefined;
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { [key: string]: any };
      verificationCode = decoded.verificationCode;
      logger.info(`verificationCode: ${verificationCode}`);
      if (!verificationCode) {
        res.status(400).json({ error: 'Verification token not found in JWT' });
        return;
      }

      const isVerified = await this.chessVerificationService.verifyChessProfile(trimmedChessUsername, verificationCode);
      if (isVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { chessUsername: trimmedChessUsername },
        });

        // Update ChessInfo table
        const stats = await createOrUpdateChessInfo(trimmedChessUsername, user.id);

        // Generate a new JWT token with the updated information
        const newToken = jwt.sign(
          { id: user.id, chessUsername: trimmedChessUsername, stats }, // Include chess stats in the token
          process.env.JWT_SECRET as string,
          { expiresIn: '1d' }
        );

        // Return success response with the new token
        res.json({ success: true, token: newToken });
      } else {
        res.status(400).json({ error: 'Verification failed' });
      }
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(400).json({ error: 'Invalid token' });
      } else if (error instanceof jwt.TokenExpiredError) {
        res.status(400).json({ error: 'Token expired' });
      } else {
        next(error);
      }
    }
  };

  public googleCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as User;
      if (!user) {
        throw new Error('User not found in request');
      }
      const token = await this.authService.generateToken(user);
      let stats;
      if (user.chessUsername) {
        stats = await createOrUpdateChessInfo(user.chessUsername, user.id);
      }

      // Check if the user was just created
      const isNewUser = user.createdAt.getTime() === user.updatedAt.getTime();

      // Include the token, isNewUser flag, and user info in the redirect URL
      const userInfo = {
        id: user.id,
        email: user.email,
        name: user.name,
        chessUsername: user.chessUsername,
        youtubeChannelId: user.youtubeChannelId
      };

      const queryParams = new URLSearchParams({
        token: token,
        isNewUser: isNewUser.toString(),
        userInfo: JSON.stringify(userInfo),
        stats: stats ? JSON.stringify(stats) : ''
      });

      res.redirect(`${process.env.FRONTEND}/signupcallback?${queryParams.toString()}`);
    } catch (error) {
      next(error);
    }
  };

  public signIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      const user = await this.authService.findUserByEmail(email);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const token = await this.authService.generateToken(user);
      res.json({ token });
    } catch (error) {
      next(error);
    }
  };
}