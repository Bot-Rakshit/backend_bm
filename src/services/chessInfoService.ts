import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { chessComConfig } from '../config/chesscom'; // Adjust the import according to your project structure

const prisma = new PrismaClient();

interface ChessStats {
  chess_rapid: {
    last: {
      rating: number;
    };
  };
  chess_bullet: {
    last: {
      rating: number;
    };
  };
  chess_blitz: {
    last: {
      rating: number;
    };
  };
  puzzle_rush: {
    best: {
      score: number;
    };
  };
}

export const createOrUpdateChessInfo = async (chessUsername: string, userId: string) => {
  try {
    const response = await axios.get(`${chessComConfig.baseURL}/${chessUsername}/stats`, { headers: chessComConfig.headers });
    const data: ChessStats = response.data;

    const blitz = data.chess_blitz?.last?.rating ?? 0;
    const bullet = data.chess_bullet?.last?.rating ?? 0;
    const rapid = data.chess_rapid?.last?.rating ?? 0;
    const puzzle = data.puzzle_rush?.best?.score ?? 0;

    const stats = await prisma.chessInfo.upsert({
      where: { userId },
      update: { blitz, bullet, rapid, puzzle },
      create: { blitz, bullet, rapid, puzzle, user: { connect: { id: userId } } },
    });
    
    return stats;
  } catch (error) {
    console.error('Failed to fetch or update Chess.com stats', error);
  }
};

export const getPercentiles = async (chessUsername: string) => {
  try {
    const response = await axios.get(`${chessComConfig.baseURL}/${chessUsername}/stats`, { headers: chessComConfig.headers });
    const data: ChessStats = response.data;

    const blitz = data.chess_blitz?.last?.rating ?? 0;
    const bullet = data.chess_bullet?.last?.rating ?? 0;
    const rapid = data.chess_rapid?.last?.rating ?? 0;

    const allUsers = await prisma.chessInfo.findMany({
      select: { blitz: true, bullet: true, rapid: true },
    });

    const calculatePercentile = (rating: number, allRatings: number[]) => {
      const below = allRatings.filter(r => r < rating).length;
      return (below / allRatings.length) * 100;
    };

    const blitzRatings = allUsers.map(user => user.blitz);
    const bulletRatings = allUsers.map(user => user.bullet);
    const rapidRatings = allUsers.map(user => user.rapid);

    const blitzPercentile = calculatePercentile(blitz, blitzRatings);
    const bulletPercentile = calculatePercentile(bullet, bulletRatings);
    const rapidPercentile = calculatePercentile(rapid, rapidRatings);

    return { blitzPercentile, bulletPercentile, rapidPercentile };
  } catch (error) {
    console.error('Failed to fetch Chess.com stats', error);
    throw new Error('Failed to fetch Chess.com stats');
  }
};