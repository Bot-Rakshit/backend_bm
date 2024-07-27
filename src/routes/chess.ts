import express from 'express';
import { ChessController } from '../controllers/chessController';
import { validateRequest } from '../middlewares/validateRequest';
import Joi from 'joi';

const router = express.Router();
const chessController = new ChessController();

router.get('/percentiles/:chessUsername', chessController.getPercentiles);
router.get('/dashboard', chessController.getDashboardStats);
router.get('/ratings/:youtubeChannelId', chessController.getChessRatingsByYoutubeId);

const multipleRatingsSchema = Joi.object({
  youtubeChannelIds: Joi.array().items(Joi.string()).required(),
});

router.post('/ratings/batch', validateRequest(multipleRatingsSchema), chessController.getMultipleChessRatings);
router.get('/registered-users', chessController.getRegisteredUsers);
router.get('/random-player', chessController.getRandomPlayer);

export default router;
