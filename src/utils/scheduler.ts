import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { createOrUpdateChessInfo } from '../services/chessInfoService';

const prisma = new PrismaClient();

const refreshChessRatings = async () => {
  const users = await prisma.user.findMany({
    where: { chessUsername: { not: null } },
    select: { chessUsername: true, id: true },
  });

  for (const user of users) {
    if (user.chessUsername) {
      await createOrUpdateChessInfo(user.chessUsername, user.id);
    }
  }
};

// Schedule the task to run every hour
cron.schedule('0 * * * *', refreshChessRatings);
