import { Request, Response, NextFunction } from 'express';
import { getPercentiles, getDashboardStats } from '../services/chessInfoService';

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
}
