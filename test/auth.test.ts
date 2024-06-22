import request from 'supertest';
import app from '../src/app';
import { PrismaClient } from '@prisma/client';
import { redisClient } from '../src/utils/redis';

const prisma = new PrismaClient();

describe('Auth Routes', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await redisClient.quit();
  });

  describe('POST /api/auth/chess-verify', () => {
    it('should return a verification code for a valid Chess.com username', async () => {
      const response = await request(app)
        .post('/api/auth/chess-verify')
        .send({ chessUsername: 'validusername' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('verificationCode');
    });

    it('should return an error for an invalid Chess.com username', async () => {
      const response = await request(app)
        .post('/api/auth/chess-verify')
        .send({ chessUsername: 'invalidusername' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });


});