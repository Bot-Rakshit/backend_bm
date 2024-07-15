import cron from 'node-cron';
import { updateAllChessInfo } from '../services/chessinfoUpdateService';
import { logger } from './logger';
import { PrismaClient } from '@prisma/client';
import { createOrUpdateChessInfo } from '../services/chessInfoService';

const prisma = new PrismaClient();

// Log the database URL
logger.info(`Database URL: ${process.env.DATABASE_URL}`);

// Function to update users with chess username but no chess info
const updateUsersWithoutChessInfo = async () => {
  try {
    const usersToUpdate = await prisma.user.findMany({
      where: {
        chessUsername: { not: null },
        chessInfo: null
      },
      select: {
        id: true,
        chessUsername: true
      }
    });

    logger.info(`Found ${usersToUpdate.length} users with chess username but no chess info`);

    for (const user of usersToUpdate) {
      if (user.chessUsername) {
        try {
          await createOrUpdateChessInfo(user.chessUsername, user.id);
          logger.info(`Created chess info for user ${user.id}`);
        } catch (error) {
          logger.error(`Failed to create chess info for user ${user.id}: ${error}`);
        }
      }
    }

    logger.info(`Completed chess info creation for ${usersToUpdate.length} users`);
  } catch (error) {
    logger.error(`Error in updateUsersWithoutChessInfo: ${error}`);
  } finally {
    await prisma.$disconnect();
  }
};

// Function to run the full update
const runChessInfoUpdate = async () => {
  try {
    await updateAllChessInfo();
    logger.info('Completed chess info update for all users');
  } catch (error) {
    logger.error(`Error in runChessInfoUpdate: ${error}`);
  }
};

// Run immediately when the server starts
updateUsersWithoutChessInfo();

// Schedule the task to run every hour
cron.schedule('0 * * * *', runChessInfoUpdate);

// Schedule a full update once a day at midnight
cron.schedule('0 0 * * *', runChessInfoUpdate);

// Export the functions to allow manual triggering if needed
export { updateUsersWithoutChessInfo, runChessInfoUpdate };
