import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { generateVerificationCode } from '../utils/generator';
import { createOrUpdateChessInfo } from '../services/chessInfoService'; // Import the function to create or update chess info
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuthService {
  public async generateToken(user: User): Promise<string> {
    if (!user || !user.id) {
      throw new Error('Invalid user object');
    }

    const verificationCode = await generateVerificationCode();

    // Fetch or update chess stats for the user
    const chessStats = user.chessUsername ? await createOrUpdateChessInfo(user.chessUsername, user.id) : null;

    return jwt.sign(
      { id: user.id, verificationCode: verificationCode, chessUsername: user.chessUsername, stats: chessStats },
      process.env.JWT_SECRET as string,
      {
        expiresIn: '1d',
      }
    );
  }

  public async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }
}
