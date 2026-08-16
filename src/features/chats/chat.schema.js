import mongoose from 'mongoose';

/**
 * A single direct message. Like requests, either party may be a User or a Team,
 * so the ids are stored bare. `conversationId` is the two ids sorted and joined,
 * which gives both participants the same key and makes the history query a
 * single indexed lookup instead of a two-branch $or.
 */
const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, required: true },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
  },
  { timestamps: true }
);

/** Stable room / conversation key for a pair of accounts, in either order. */
export const conversationIdFor = (a, b) => [String(a), String(b)].sort().join('_');

const Message = mongoose.model('Message', messageSchema);
export default Message;
