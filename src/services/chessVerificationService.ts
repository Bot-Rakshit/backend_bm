import axios from 'axios';
import { isValidChessComId, chessComConfig } from '../config/chesscom';

export class ChessVerificationService {
  public async isValidChessComId(chessUsername: string): Promise<boolean> {
    return isValidChessComId(chessUsername);
  }

  public async verifyChessProfile(chessUsername: string, verificationCode: string): Promise<boolean> {
    if (!verificationCode) {
      throw new Error('Verification code expired or not found');
    }

    try {
      const response = await axios.get(`${chessComConfig.baseURL}/${chessUsername}`, { headers: chessComConfig.headers });
      const profileData = response.data;
      return profileData.location === verificationCode;
    } catch (error) {
      throw new Error('Failed to verify Chess.com profile');
    }
  }
}