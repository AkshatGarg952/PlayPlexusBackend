import mongoose from 'mongoose';

export const REQUEST_STATUSES = ['pending', 'accepted', 'rejected', 'expired', 'cancelled'];

/**
 * A play request from one account to another. Sender and receiver may each be a
 * User or a Team, so they are stored as bare ObjectIds plus a `*Model`
 * discriminator rather than a single `ref`. Display names are denormalised onto
 * the document so listing requests never needs a second round of lookups.
 */
const requestSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    senderModel: { type: String, enum: ['User', 'Team'], required: true },
    senderName: { type: String, required: true },

    receiver: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    receiverModel: { type: String, enum: ['User', 'Team'], required: true },
    receiverName: { type: String, required: true },

    message: { type: String, trim: true, maxlength: [1000, 'Message cannot exceed 1000 characters'] },
    status: { type: String, enum: REQUEST_STATUSES, default: 'pending', index: true },
    seen: { type: Boolean, default: false },

    sport: { type: String, trim: true },
    game: { type: String, trim: true },
    venue: { type: String, trim: true },
    platform: { type: String, trim: true },

    /** When the match itself is scheduled for. */
    scheduledFor: { type: Date },

    expiresIn: { type: Number },
    expiresAt: { type: Date, index: true },
  },
  { timestamps: true }
);

const Request = mongoose.model('Request', requestSchema);
export default Request;
