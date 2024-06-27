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
      const user = req.user as User;
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!user) {
        res.status(400).json({ error: 'User not found' });
        return;
      }

      // Check if the Chess.com ID is already linked to another user
      const existingUser = await prisma.user.findUnique({ where: { chessUsername } });
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

      const isVerified = await this.chessVerificationService.verifyChessProfile(chessUsername, verificationCode);
      if (isVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { chessUsername },
        });

        // Update ChessInfo table
        const stats = await createOrUpdateChessInfo(chessUsername, user.id);

        // Generate a new JWT token with the updated information
        const newToken = jwt.sign(
          { id: user.id, chessUsername, stats },
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

      res.redirect(`${process.env.FRONTEND}/signupcallback?token=${token}`);
    } catch (error) {
      next(error);
    }
  };
}