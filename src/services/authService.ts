import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { ChessVerificationService } from './chessVerificationService';
import { generateVerificationCode } from '../utils/generator';

export class AuthService {
  public async generateToken(user: User): Promise<string> {
    const verificationCode = await generateVerificationCode();
    return jwt.sign({ id: user.id, verificationCode:verificationCode, chessUsername: user.chessUsername }, process.env.JWT_SECRET as string, {
      expiresIn: '1d',
    });
  }
}