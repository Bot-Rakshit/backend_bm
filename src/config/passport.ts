import dotenv from 'dotenv';
import path from 'path';
import { createOrUpdateChessInfo } from '../services/chessInfoService';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';
import { User } from '../models/User';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptionsWithRequest, VerifiedCallback } from 'passport-jwt';
import { google } from 'googleapis';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const prisma = new PrismaClient();

interface ProfileJson {
  youtubeChannelId?: string;
}

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const callbackURL = process.env.GOOGLE_CALLBACK_URL || 'https://api.bmsamay.com/api/auth/google/callback';

console.log('Google Client ID:', clientID);
console.log('Google Callback URL:', callbackURL);

if (!clientID || !clientSecret) {
  console.error('Google OAuth credentials are missing. Please check your environment variables.');
  process.exit(1);
}

passport.use(
  new GoogleStrategy(
    {
      clientID,
      clientSecret,
      callbackURL,
    },
    async (accessToken, refreshToken, profile: any, done) => {
      try {
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
        
        const response = await youtube.channels.list({
          part: ['id'],
          mine: true,
        });

        const youtubeChannelId = response.data.items?.[0]?.id;

        let user = await prisma.user.findUnique({
          where: { googleId: profile.id },
          include: { chessInfo: true },
        });

        if (user) {
          // Existing user: Update their information
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              email: profile.emails?.[0].value,
              name: profile.displayName,
              youtubeChannelId: youtubeChannelId,
            },
            include: { chessInfo: true },
          });

          if (user.chessUsername) {
            await createOrUpdateChessInfo(user.chessUsername, user.id);
          }
        } else {
          // New user: Create a new user record
          user = await prisma.user.create({
            data: {
              googleId: profile.id,
              email: profile.emails?.[0].value,
              name: profile.displayName,
              youtubeChannelId: youtubeChannelId,
            },
            include: { chessInfo: true },
          });
        }

        return done(null, user);
      } catch (error) {
        done(error as Error, undefined);
      }
    }
  )
);

passport.serializeUser((user: User, done) => {
  console.log('Serializing user:', user.id);
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  console.log('Deserializing user:', id);
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    console.error('Error deserializing user:', error);
    done(error, null);
  }
});

// JWT Strategy
const jwtOptions: StrategyOptionsWithRequest = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET as string,
  passReqToCallback: true,
};

passport.use(
  new JwtStrategy(jwtOptions, async (req, payload, done: VerifiedCallback) => {
    console.log('JWT strategy called');
    try {
      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (user) {
        console.log('User found in JWT strategy:', user.id);
        return done(null, user);
      } else {
        console.log('No user found in JWT strategy');
        return done(null, false);
      }
    } catch (error) {
      console.error('Error in JWT strategy:', error);
      return done(error, false);
    }
  })
);
