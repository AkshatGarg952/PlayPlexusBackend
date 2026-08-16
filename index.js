import http from 'http';
import config from './src/config/env.js';
import createApp from './src/app.js';
import connectDB, { disconnectDB } from './src/database/mongoose.js';
import createSocketServer from './src/realtime/socket.js';
import startExpiryJob from './src/features/requests/expiration.js';

const start = async () => {
  // Connect first: if the database is unreachable there is no point listening.
  await connectDB();

  const app = createApp();
  const server = http.createServer(app);
  const io = createSocketServer(server);

  // Controllers reach the socket server through the app, avoiding a module-level
  // singleton and keeping the realtime layer injectable in tests.
  app.set('io', io);

  const stopExpiryJob = startExpiryJob();

  server.listen(config.port, () => {
    console.log(`[server] listening on port ${config.port} (${config.env})`);
  });

  const shutdown = async (signal) => {
    console.log(`[server] ${signal} received, shutting down`);
    stopExpiryJob();
    io.close();
    server.close();
    await disconnectDB();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

start().catch((error) => {
  console.error('[server] failed to start:', error.message);
  process.exit(1);
});
