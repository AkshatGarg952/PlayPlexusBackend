import express from 'express';
import cors from 'cors';
import config from './config/env.js';
import userRouter from './features/users/user.routes.js';
import teamRouter from './features/teams/team.routes.js';
import requestRouter from './features/requests/request.routes.js';
import chatRouter from './features/chats/chat.routes.js';
import chatBotRouter from './features/chatbot/chatbot.routes.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

/**
 * Builds the Express app. Kept separate from server start-up so the routes can
 * be mounted without opening a port.
 */
export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: config.corsOrigins,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

  app.use('/api/users', userRouter);
  app.use('/api/teams', teamRouter);
  app.use('/api/requests', requestRouter);
  app.use('/api/chats', chatRouter);
  app.use('/api/chatBot', chatBotRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export default createApp;
