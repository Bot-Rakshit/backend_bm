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
import { setupChatSocket } from './controllers/chatController';
import './config/passport';
import {logger} from './utils/logger';
import './utils/scheduler';

const app = express();

// Configure CORS to allow requests from the frontend
app.use(cors({
  origin: process.env.FRONTEND || 'http://localhost:5173',
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

app.use('/api/auth', authRoutes);
app.use('/api/chess', chessRoutes);
app.use(errorHandler);

// Create HTTP server and setup Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND || 'http://localhost:5173',
    methods: ["GET", "POST"]
  }
});

server.listen(2999, () => {
  logger.info(`Server is running on port ${2999}`);
});

// Setup chat socket connections
setupChatSocket(io);

export default app;