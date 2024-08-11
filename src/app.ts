import express from 'express';
import passport from 'passport';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import session from 'express-session';
import http from 'http';
import { Server } from 'socket.io';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/auth';
import chessRoutes from './routes/chess';
import setupChatRoutes from './routes/chat';
import { setupChatSocket } from './controllers/chatController';
import './config/passport';
import { logger } from './utils/logger';
import './utils/scheduler';

const app = express();

const allowedOrigins = [process.env.FRONTEND, 'http://localhost:5173', 'https://www.bmsamay.com'];

// Configure CORS to allow requests from the frontend
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure express-session
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.use(passport.initialize());
app.use(passport.session());

// Create HTTP server and setup Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Setup routes
app.use('/api/auth', authRoutes);
app.use('/api/chess', chessRoutes);
app.use('/api/chat', setupChatRoutes(io));
app.use(errorHandler);

// Setup chat socket connections
setupChatSocket(io);

server.listen(2999, () => {
  logger.info(`Server is running on port ${2999}`);
});

export default app;
