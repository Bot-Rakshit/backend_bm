import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  logger.error(err.stack);

  const frontendUrl = process.env.FRONTEND || 'https://bmsamay.com';

  // Always redirect to the frontend's /blunder page for 500 Internal Server Errors
  res.redirect(`${frontendUrl}/blunder`);
};
