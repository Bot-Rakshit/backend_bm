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
  '/chess-verify',
  passport.authenticate('jwt', { session: false }),
  validateRequest(chessVerificationSchema),
  authController.initiateChessVerification
);

router.post(
  '/chess-verify/confirm',
  passport.authenticate('jwt', { session: false }),
  validateRequest(chessVerificationSchema),
  authController.confirmChessVerification
);

router.get(
  '/test',
  (req, res) => {
    res.send('test');
  }
);

router.get('/google', (req, res, next) => {
  passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/youtube.readonly'],
    accessType: 'offline',
    prompt: 'select_account'
  })(req, res, next);
});

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }), // Ensure Passport sets the user
  authController.googleCallback
);

export default router;