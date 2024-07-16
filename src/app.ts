import express from 'express';
import passport from 'passport';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import session from 'express-session';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/auth';
import chessRoutes from './routes/chess';
import './config/passport';
import './utils/scheduler';
import http from 'http';

const app = express();
export { app };
const server = http.createServer(app);

// Configure CORS to allow requests from the frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', process.env.FRONTEND].filter(Boolean),
  credentials: true // Allow credentials (cookies, authorization headers, etc.)
}));

app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure express-session
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key', // Use a strong secret key
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' } // Use secure cookies in production
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', authRoutes);
app.use('/api/chess', chessRoutes); // Use the imported chatRoutes
app.use(errorHandler);

export { server };