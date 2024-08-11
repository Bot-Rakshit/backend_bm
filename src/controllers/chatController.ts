import { Server, Socket } from 'socket.io';
import { Masterchat, stringify } from 'masterchat';

let activeSockets: Map<string, Socket> = new Map();
let currentChat: Masterchat | null = null;

const HEARTBEAT_INTERVAL = 30000;
const HEARTBEAT_TIMEOUT = 60000;

const setupChatSocket = (io: Server) => {
  const startYouTubeChat = async (videoId: string) => {
    console.log(`Attempting to initialize YouTube chat for video: ${videoId}`);
    
    try {
      if (currentChat) {
        await currentChat.stop();
      }

      currentChat = await Masterchat.init(videoId);

      const chats = currentChat.iter().filter((action) => action.type === "addChatItemAction");

      for await (const chat of chats) {
        io.emit('chatMessage', {
          author: {
            name: chat.authorName,
            channelId: chat.authorChannelId,
          },
          message: stringify(chat.message),
          timestamp: chat.timestamp,
        });
      }

      io.emit('chatStarted', { videoId });
    } catch (error) {
      console.error('Error initializing YouTube chat:', error);
      io.emit('error', `Failed to start listening for chat messages: ${error.message}`);
    }
  };

  io.on('connection', (socket: Socket) => {
    console.log(`New client connected: ${socket.id}`);
    activeSockets.set(socket.id, socket);
    console.log(`Active connections: ${activeSockets.size}`);

    socket.on('switchChannel', (videoId: string) => {
      startYouTubeChat(videoId);
    });

    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected: ${socket.id}, Reason: ${reason}`);
      activeSockets.delete(socket.id);
      console.log(`Active connections: ${activeSockets.size}`);
    });

    // Implement heartbeat
    let heartbeatTimeout: NodeJS.Timeout;
    const resetHeartbeat = () => {
      if (heartbeatTimeout) clearTimeout(heartbeatTimeout);
      heartbeatTimeout = setTimeout(() => {
        console.log(`Heartbeat timeout for client: ${socket.id}`);
        socket.disconnect(true);
      }, HEARTBEAT_TIMEOUT);
    };

    socket.on('heartbeat', () => {
      resetHeartbeat();
    });

    resetHeartbeat();
  });

  // Periodic cleanup of stale connections
  setInterval(() => {
    for (const [id, socket] of activeSockets) {
      if (!socket.connected) {
        activeSockets.delete(id);
        socket.disconnect(true);
        console.log(`Removed stale connection: ${id}`);
      }
    }

    console.log(`Active connections after cleanup: ${activeSockets.size}`);
  }, HEARTBEAT_INTERVAL);
};

export { setupChatSocket };
