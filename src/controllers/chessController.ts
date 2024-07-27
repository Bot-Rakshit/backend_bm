import { Request, Response, NextFunction } from 'express';
import { getPercentiles, getDashboardStats, getChessStats } from '../services/chessInfoService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ChessController {
  public getPercentiles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { chessUsername } = req.params;
      const percentiles = await getPercentiles(chessUsername);
      res.json(percentiles);
    } catch (error) {
      next(error);
    }
  };

  public getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await getDashboardStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  };

  public getChessRatingsByYoutubeId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { youtubeChannelId } = req.params;

      const user = await prisma.user.findFirst({
        where: { youtubeChannelId },
        include: { chessInfo: true },
      });

      if (!user || !user.chessInfo) {
        res.status(404).json({ error: 'User not found or has no chess information' });
        return;
      }

      const response = {
        chessUsername: user.chessUsername,
        ratings: {
          blitz: user.chessInfo.blitz,
          bullet: user.chessInfo.bullet,
          rapid: user.chessInfo.rapid,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  public getMultipleChessRatings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { youtubeChannelIds } = req.body;

      if (!Array.isArray(youtubeChannelIds)) {
        res.status(400).json({ error: 'Invalid input: youtubeChannelIds must be an array' });
        return;
      }

      const users = await prisma.user.findMany({
        where: { youtubeChannelId: { in: youtubeChannelIds } },
        include: { chessInfo: true },
      });

      const response = await Promise.all(users.map(async (user) => ({
        youtubeChannelId: user.youtubeChannelId,
        chessUsername: user.chessUsername,
        ratings: user.chessInfo ? {
          blitz: user.chessInfo.blitz,
          bullet: user.chessInfo.bullet,
          rapid: user.chessInfo.rapid,
        } : await getChessStats(user.chessUsername || ''),
      })));

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  public getRegisteredUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await prisma.user.findMany({
        select: { youtubeChannelId: true },
        where: { youtubeChannelId: { not: null } },
      });

      const channelIds = users.map(user => user.youtubeChannelId).filter(Boolean);

      res.json(channelIds);
    } catch (error) {
      next(error);
    }
  };

  public getRandomPlayer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const randomPlayer = await prisma.user.findMany({
        where: {
          chessInfo: {
            isNot: null
          }
        },
        include: {
          chessInfo: true
        },
        take: 1,
        orderBy: {
          id: 'asc'
        },
        cursor: {
          id: (await prisma.user.aggregate({
            where: {
              chessInfo: {
                isNot: null
              }
            },
            _count: true
          }))._count > 0
            ? (await prisma.user.findMany({
                where: {
                  chessInfo: {
                    isNot: null
                  }
                },
                select: { id: true },
                take: 1,
                skip: Math.floor(Math.random() * (await prisma.user.count({ where: { chessInfo: { isNot: null } } })))
              }))[0].id
            : undefined
        }
      });

      if (randomPlayer.length === 0) {
        res.status(404).json({ error: 'No players found with chess info' });
        return;
      }

      const player = randomPlayer[0];
      const response = {
        name: player.name,
        chessUsername: player.chessUsername,
        ratings: {
          blitz: player.chessInfo?.blitz,
          bullet: player.chessInfo?.bullet,
          rapid: player.chessInfo?.rapid,
          puzzle: player.chessInfo?.puzzle
        }
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
