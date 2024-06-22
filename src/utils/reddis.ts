import { createClient } from 'redis';
import { logger } from './logger';
require('dotenv').config();

const redisPort = Number(process.env.REDIS_PORT);
if (isNaN(redisPort) || redisPort < 0 || redisPort > 65535) {
  logger.error('Invalid REDIS_PORT. Please set it to a number between 0 and 65535.');
  process.exit(1); // Exit the process if the port is not valid
}

export const redisClient = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: redisPort,
  },
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));

redisClient.connect().catch((err) => logger.error('Redis Connection Error', err));