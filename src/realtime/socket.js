import { Server } from 'socket.io';
import config from '../config/env.js';
import { verifyToken } from '../middleware/jwt.auth.js';
import ChatRepository from '../features/chats/chat.repository.js';
import { conversationIdFor } from '../features/chats/chat.schema.js';

const chatRepository = new ChatRepository();

/** Private room every account joins, used to push it request updates. */
export const accountRoom = (id) => `account:${id}`;

/**
 * Socket.IO wiring. Every connection must present the same JWT the REST API
 * uses; the authenticated id is the only identity the server trusts, so a
 * client cannot send messages as somebody else.
 */
export const createSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      socket.data.accountId = String(verifyToken(token).id);
      return next();
    } catch {
      return next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const { accountId } = socket.data;
    socket.join(accountRoom(accountId));

    socket.on('joinConversation', (peerId) => {
      if (!peerId || typeof peerId !== 'string') return;
      socket.join(conversationIdFor(accountId, peerId));
    });

    socket.on('sendMessage', async ({ message, receiverId } = {}, ack) => {
      try {
        const text = typeof message === 'string' ? message.trim() : '';
        if (!text || !receiverId) {
          return ack?.({ error: 'A message and a recipient are required.' });
        }
        if (String(receiverId) === accountId) {
          return ack?.({ error: 'You cannot message yourself.' });
        }

        // senderId comes from the token, never from the payload.
        const saved = await chatRepository.create({
          senderId: accountId,
          receiverId,
          message: text,
        });

        io.to(conversationIdFor(accountId, receiverId)).emit('receiveMessage', saved.toJSON());
        return ack?.({ ok: true, message: saved.toJSON() });
      } catch (error) {
        console.error('[socket] sendMessage failed:', error.message);
        return ack?.({ error: 'Could not send the message. Please try again.' });
      }
    });

    socket.on('disconnect', (reason) => {
      if (!config.isProduction) {
        console.log(`[socket] ${socket.id} disconnected (${reason})`);
      }
    });
  });

  return io;
};

export default createSocketServer;
