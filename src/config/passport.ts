import { createOrUpdateChessInfo } from '../services/chessInfoService';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';
import { User } from '../models/User';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptionsWithRequest, VerifiedCallback } from 'passport-jwt';
import { google } from 'googleapis';

const prisma = new PrismaClient();

interface ProfileJson {
  youtubeChannelId?: string;
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: 'https://shahmaat.fun/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile: any, done) => {
      const profileJson: ProfileJson = profile._json;
      try {
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
        
        const response = await youtube.channels.list({
          part: ['id'],
          mine: true,
        });

        const youtubeChannelId = response.data.items?.[0]?.id;

        const existingUser = await prisma.user.findUnique({
          where: { googleId: profile.id },
          include: { chessInfo: true },
        });

        if (existingUser) {
          if (existingUser.chessUsername) {
            await createOrUpdateChessInfo(existingUser.chessUsername, existingUser.id);
          }
          return done(null, existingUser);
        }

        const newUser = await prisma.user.create({
          data: {
            googleId: profile.id,
            email: profile.emails?.[0].value,
            name: profile.displayName,
            youtubeChannelId: youtubeChannelId,
          },
        });

        if (newUser.chessUsername) {
          await createOrUpdateChessInfo(newUser.chessUsername, newUser.id);
        }

        done(null, newUser);
      } catch (error) {
        done(error as Error, undefined);
      }
    }
  )
);

passport.serializeUser((user: User, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
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
    try {
      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    } catch (error) {
      return done(error, false);
    }
  })
);



