import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { createOrUpdateChessInfo } from '../services/chessInfoService';

const prisma = new PrismaClient();

const updateOldChessComUsers = async () => {
  console.log('Starting updateOldChessComUsers job at', new Date().toISOString());
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const users = await prisma.user.findMany({
    where: {
      chessUsername: { not: null },
      updatedAt: { lt: twentyFourHoursAgo },
    },
    select: { id: true, chessUsername: true },
  });

  console.log(`Found ${users.length} users with Chess.com information older than 24 hours`);

  for (const user of users) {
    if (user.chessUsername) {
      console.log(`Updating chess info for user ${user.id} with username ${user.chessUsername}`);
      try {
        const updatedStats = await createOrUpdateChessInfo(user.chessUsername, user.id);
        console.log(`Successfully updated chess info for user ${user.id}:`, updatedStats);
        
        // Update the user's updatedAt timestamp
        await prisma.user.update({
          where: { id: user.id },
          data: { updatedAt: new Date() },
        });
      } catch (error) {
        console.error(`Failed to update chess info for user ${user.id}:`, error);
      }
    }
  }

  console.log('Finished updating Chess.com users');
};

const refreshChessRatings = async () => {
  console.log('Starting hourly refreshChessRatings job at', new Date().toISOString());
  const users = await prisma.user.findMany({
    where: { chessUsername: { not: null } },
    select: { id: true, chessUsername: true },
  });

  console.log(`Refreshing chess ratings for ${users.length} users`);

  for (const user of users) {
    if (user.chessUsername) {
      try {
        const updatedStats = await createOrUpdateChessInfo(user.chessUsername, user.id);
        console.log(`Refreshed chess info for user ${user.id}:`, updatedStats);
        
        // Update the user's updatedAt timestamp
        await prisma.user.update({
          where: { id: user.id },
          data: { updatedAt: new Date() },
        });
      } catch (error) {
        console.error(`Failed to refresh chess info for user ${user.id}:`, error);
      }
    }
  }

  console.log('Finished refreshing Chess.com users');
};

// Run the update for old Chess.com users immediately
updateOldChessComUsers();

// Schedule the task to run every day at midnight
cron.schedule('0 0 * * *', updateOldChessComUsers);

// Schedule the hourly refresh task
cron.schedule('0 * * * *', refreshChessRatings);
