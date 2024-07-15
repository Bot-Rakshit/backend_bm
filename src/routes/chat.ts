import express from 'express';
import { ChatController } from '../controllers/chatController';

const router = express.Router();
const chatController = new ChatController();

router.post('/livestream/start', chatController.startLiveStreamChat);
router.get('/livestream/:liveId/messages', chatController.getLiveStreamMessages);
router.post('/livestream/:liveId/stop', chatController.stopLiveStreamChat);

export default router;