import express from 'express';
import { Server } from 'socket.io';
import { Masterchat } from 'masterchat';

const router = express.Router();

const setupChatRoutes = (io: Server) => {
  router.post('/switch-channel', async (req, res) => {
    const { videoUrl } = req.body;
    if (videoUrl) {
      try {
        const chat = await Masterchat.init(videoUrl);
        const videoInfo = chat.metadata;

        io.emit('switchChannel', videoUrl);
        res.status(200).json({ 
          message: 'Channel switch initiated',
          videoTitle: videoInfo.title,
          channelTitle: videoInfo.channelName,
          isLiveStream: videoInfo.isLive
        });
      } catch (error) {
        console.error('Error fetching video details:', error);
        res.status(500).json({ error: 'Failed to fetch video details' });
      }
    } else {
      res.status(400).json({ error: 'Video URL is required' });
    }
  });

  return router;
};

export default setupChatRoutes;
