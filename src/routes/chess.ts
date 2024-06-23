import express from 'express';
import { ChessController } from '../controllers/chessController';

const router = express.Router();
const chessController = new ChessController();

router.get('/percentiles/:chessUsername', chessController.getPercentiles);

export default router;
