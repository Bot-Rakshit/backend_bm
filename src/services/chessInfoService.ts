import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { chessComConfig } from '../config/chesscom';

const prisma = new PrismaClient();

export const createOrUpdateChessInfo = async (chessUsername: string, userId: string) => {
  try {
    const response = await axios.get(`${chessComConfig.baseURL}/${chessUsername}/stats`, { headers: chessComConfig.headers });
    const { blitz, bullet, rapid, puzzle } = response.data;

    await prisma.chessInfo.upsert({
      where: { userId },
      update: { blitz, bullet, rapid, puzzle },
      create: { id: userId, blitz, bullet, rapid, puzzle, userId },
    });
  } catch (error) {
    console.error('Failed to fetch or update Chess.com stats', error);
  }
};
