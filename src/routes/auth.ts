import express from 'express';
import passport from 'passport';
import { AuthController } from '../controllers/authController';
import { validateRequest } from '../middlewares/validateRequest'; 
import Joi from 'joi';

const router = express.Router();
const authController = new AuthController();

const chessVerificationSchema = Joi.object({
  chessUsername: Joi.string().required(),
});

router.post(
  '/chess-verify/confirm',
  passport.authenticate('jwt', { session: false }), // Ensure user is authenticated
  validateRequest(chessVerificationSchema),
  authController.confirmChessVerification
);

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email', 'https://www.googleapis.com/auth/youtube.readonly'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  authController.googleCallback
);

export default router;