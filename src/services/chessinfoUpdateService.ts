import { PrismaClient } from '@prisma/client';
import { createOrUpdateChessInfo } from './chessInfoService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export async function updateAllChessInfo() {
  try {
    const usersWithChessUsername = await prisma.user.findMany({
      where: {
        chessUsername: {
          not: null
        }
      },
      select: {
        id: true,
        chessUsername: true
      }
    });

    for (const user of usersWithChessUsername) {
      if (user.chessUsername) {
        try {
          await createOrUpdateChessInfo(user.chessUsername, user.id);
          logger.info(`Updated chess info for user ${user.id}`);
        } catch (error) {
          logger.error(`Failed to update chess info for user ${user.id}: ${error}`);
        }
      }
    }

    logger.info(`Completed chess info update for ${usersWithChessUsername.length} users`);
  } catch (error) {
    logger.error(`Error in updateAllChessInfo: ${error}`);
  } finally {
    await prisma.$disconnect();
  }
}