import { Server, Socket } from 'socket.io';
import { Masterchat, stringify } from 'masterchat';

let masterchat: Masterchat | null = null;
let activeSockets: Map<string, Socket> = new Map();

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const HEARTBEAT_TIMEOUT = 60000; // 60 seconds

const setupChatSocket = (io: Server) => {
  const startMasterchat = async (videoUrl: string) => {
    console.log(`Attempting to initialize Masterchat for video: ${videoUrl}`);
    if (masterchat) {
      console.log('Stopping existing Masterchat instance');
      await masterchat.stop();
    }

    try {
      console.log('Creating new Masterchat instance');
      masterchat = await Masterchat.init(videoUrl);
      console.log('Masterchat initialized successfully');

      const chats = masterchat.iter().filter((action) => action.type === "addChatItemAction");

      for await (const chat of chats) {
        console.log('Emitting chat message:', chat);
        io.emit('chatMessage', {
          author: {
            name: chat.authorName,
            channelId: chat.authorChannelId,
          },
          message: stringify(chat.message),
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error('Error initializing Masterchat:', error);
      io.emit('error', 'Failed to start listening for live chat messages');
      masterchat = null;
    }
  };

  io.on('connection', (socket: Socket) => {
    console.log(`New client connected: ${socket.id}`);
    activeSockets.set(socket.id, socket);
    console.log(`Active connections: ${activeSockets.size}`);

    socket.on('switchChannel', (videoUrl: string) => {
      startMasterchat(videoUrl);
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
