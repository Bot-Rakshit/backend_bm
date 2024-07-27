import { Request, Response, NextFunction } from 'express';
import { LiveChat } from 'youtube-chat';

export class ChatController {
  private activeLiveChats: Map<string, LiveChat> = new Map();

  public startLiveStreamChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { url } = req.query;
      if (!url || typeof url !== 'string') {
        res.status(400).json({ error: 'Invalid YouTube URL' });
        return;
      }

      const liveId = this.extractLiveId(url);
      if (!liveId) {
        res.status(400).json({ error: 'Invalid YouTube URL' });
        return;
      }

      if (!this.activeLiveChats.has(liveId)) {
        const liveChat = new LiveChat({ liveId });
        this.activeLiveChats.set(liveId, liveChat);
        await liveChat.start();
      }

      res.status(200).json({ message: 'Live chat started', liveId });
    } catch (error) {
      next(error);
    }
  };

  public getLiveStreamMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { liveId } = req.params;
      const liveChat = this.activeLiveChats.get(liveId);

      if (!liveChat) {
        res.status(404).json({ error: 'Live chat not found' });
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      const messageHandler = (chatItem: any) => {
        res.write(`data: ${JSON.stringify(chatItem)}\n\n`);
      };

      const errorHandler = (err: Error) => {
        console.error('LiveChat error:', err);
        res.write(`data: ${JSON.stringify({ error: 'An error occurred' })}\n\n`);
      };

      liveChat.on('chat', messageHandler);
      liveChat.on('error', errorHandler);

      req.on('close', () => {
        liveChat.off('chat', messageHandler);
        liveChat.off('error', errorHandler);
      });
    } catch (error) {
      next(error);
    }
  };

  public stopLiveStreamChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { liveId } = req.params;
      const liveChat = this.activeLiveChats.get(liveId);

      if (!liveChat) {
        res.status(404).json({ error: 'Live chat not found' });
        return;
      }

      await liveChat.stop();
      this.activeLiveChats.delete(liveId);
      res.status(200).json({ message: 'Live chat stopped' });
    } catch (error) {
      next(error);
    }
  };

  private extractLiveId = (url: string): string | null => {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };
}
