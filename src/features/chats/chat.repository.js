import Message from './chat.schema.js';
import { conversationIdFor } from './chat.schema.js';

export default class ChatRepository {
  /** Full history between two accounts, oldest first. */
  async history(senderId, receiverId) {
    return Message.find({ conversationId: conversationIdFor(senderId, receiverId) }).sort({
      createdAt: 1,
    });
  }

  async create({ senderId, receiverId, message }) {
    return Message.create({
      conversationId: conversationIdFor(senderId, receiverId),
      senderId,
      receiverId,
      message,
    });
  }
}
