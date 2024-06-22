import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { ChessVerificationService } from '../services/chessVerificationService';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';
import { User } from '../models/User';

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
      const isValid = await this.chessVerificationService.isValidChessComId(chessUsername);
      if (!isValid) {
        res.status(400).json({ error: 'Invalid Chess.com username' });
        return;
      }
      const verificationCode = await this.chessVerificationService.generateVerificationCode(chessUsername);
      res.json({ verificationCode });
    } catch (error) {
      next(error);
    }
  };

  public confirmChessVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { chessUsername } = req.body;
      const user = req.user as User;

      if (!user) {
        res.status(400).json({ error: 'User not found' });
        return;
      }

      const isVerified = await this.chessVerificationService.verifyChessProfile(chessUsername);
      if (isVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { chessUsername },
        });
        res.json({ success: true, message: 'Chess.com profile verified' });
      } else {
        res.status(400).json({ error: 'Verification failed' });
      }
    } catch (error) {
      next(error);
    }
  };

  public googleCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as User;
      const token = await this.authService.generateToken(user);
      res.json({ token });
    } catch (error) {
      next(error);
    }
  };
}