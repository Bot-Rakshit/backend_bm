import { redisClient } from '../utils/reddis';
import axios from 'axios';
import { isValidChessComId, chessComConfig } from '../config/chesscom';

export class ChessVerificationService {
  public async isValidChessComId(chessUsername: string): Promise<boolean> {
    return isValidChessComId(chessUsername);
  }

  public async generateVerificationCode(chessUsername: string): Promise<string> {
    const verificationCode = Math.random().toString(36).substring(2, 15);
    await redisClient.set(chessUsername, verificationCode, { EX: 3600 }); // Expires in 1 hour
    return verificationCode;
  }

  public async verifyChessProfile(chessUsername: string): Promise<boolean> {
    const storedCode = await redisClient.get(chessUsername);
    if (!storedCode) {
      throw new Error('Verification code expired or not found');
    }

    try {
      const response = await axios.get(`${chessComConfig.baseURL}/${chessUsername}`, { headers: chessComConfig.headers });
      const profileData = response.data;
      return profileData.location === storedCode;
    } catch (error) {
      throw new Error('Failed to verify Chess.com profile');
    }
  }
}