import { Server, Socket } from 'socket.io';
import { LiveChat } from 'youtube-chat';

const CHANNEL_ID = 'UCAov2BBv1ZJav0c_yHEciAw';

const setupChatSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('New client connected');

    let liveChat: LiveChat | null = null;

    const startLiveChat = async () => {
      if (liveChat) {
        await liveChat.stop();
      }

      liveChat = new LiveChat({ channelId: CHANNEL_ID });

      liveChat.on('start', (liveId) => {
        console.log(`LiveChat started for live stream: ${liveId}`);
        socket.emit('chatStarted', { liveId });
      });

      liveChat.on('end', () => {
        console.log('LiveChat ended');
        socket.emit('chatEnded');
      });

      liveChat.on('chat', (chatItem) => {
        socket.emit('chatMessage', chatItem);
      });

      liveChat.on('error', (err) => {
        console.error('LiveChat error:', err);
        socket.emit('error', 'An error occurred with the live chat');
      });

      try {
        await liveChat.start();
        console.log('Listening for live chat messages');
      } catch (error) {
        console.error('Error starting LiveChat:', error);
        socket.emit('error', 'Failed to start listening for live chat messages');
      }
    };

    socket.on('startChat', startLiveChat);

    socket.on('disconnect', () => {
      console.log('Client disconnected');
      if (liveChat) {
        liveChat.stop();
      }
    });
  });
};

export { setupChatSocket };