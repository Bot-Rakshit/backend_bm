import express from 'express';
import passport from 'passport';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import session from 'express-session';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/auth';
import chessRoutes from './routes/chess';// Import the test routes
import './config/passport';
import './utils/scheduler';
import chatRoutes from './routes/chat'; // Added import for chatRoutes

const app = express();

// Configure CORS to allow requests from the frontend
app.use(cors({
  origin: process.env.FRONTEND || 'wa', // Use the FRONTEND environment variable or default to localhost
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
app.use('/api/chess', chessRoutes);// Use the test routes
app.use('/api/chat', chatRoutes); // Use the imported chatRoutes
app.use(errorHandler);

export default app;
