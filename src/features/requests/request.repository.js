import mongoose from 'mongoose';
import Request from './request.schema.js';
import User from '../users/user.schema.js';
import Team from '../teams/team.schema.js';
import ApiError from '../../utils/ApiError.js';

const EXPIRY_UNIT_MS = {
  seconds: 1000,
  minutes: 60 * 1000,
  hours: 60 * 60 * 1000,
};

const MAX_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * An id may belong to a User or a Team. Resolves whichever it is and returns
 * the display name plus the model discriminator.
 */
const resolveAccount = async (id, role) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest(`"${id}" is not a valid ${role} id.`);
  }

  const user = await User.findById(id);
  if (user) return { id: user._id, name: user.username, model: 'User' };

  const team = await Team.findById(id);
  if (team) return { id: team._id, name: team.name, model: 'Team' };

  throw ApiError.notFound(`No user or team found for the ${role}.`);
};

/** Turns the form's {expiryTime, expiryUnit} pair into a validated duration. */
const parseExpiry = ({ expiryTime, expiryUnit }) => {
  const amount = Number(expiryTime);
  const unitMs = EXPIRY_UNIT_MS[expiryUnit];

  if (!Number.isFinite(amount) || amount <= 0) {
    throw ApiError.badRequest('Expiry time must be a positive number.');
  }
  if (!unitMs) {
    throw ApiError.badRequest(`Expiry unit must be one of: ${Object.keys(EXPIRY_UNIT_MS).join(', ')}.`);
  }

  const durationMs = amount * unitMs;
  if (durationMs > MAX_EXPIRY_MS) {
    throw ApiError.badRequest('Expiry time cannot be more than 30 days.');
  }

  return durationMs;
};

/** Counts per status, shaped for the dashboard charts. */
const summarise = async (field, id) => {
  const match = { [field]: new mongoose.Types.ObjectId(String(id)) };

  const [total, statusWise] = await Promise.all([
    Request.countDocuments(match),
    Request.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  return { total, statusWise };
};

export default class RequestRepository {
  async send(senderId, receiverId, body) {
    if (String(senderId) === String(receiverId)) {
      throw ApiError.badRequest('You cannot send a request to yourself.');
    }

    const [sender, receiver] = await Promise.all([
      resolveAccount(senderId, 'sender'),
      resolveAccount(receiverId, 'receiver'),
    ]);

    if (!body.message?.trim()) {
      throw ApiError.badRequest('A message is required.');
    }

    const scheduledFor = new Date(body.dateTime);
    if (Number.isNaN(scheduledFor.getTime())) {
      throw ApiError.badRequest('A valid date and time is required.');
    }

    const durationMs = parseExpiry(body);

    return Request.create({
      sender: sender.id,
      senderModel: sender.model,
      senderName: sender.name,
      receiver: receiver.id,
      receiverModel: receiver.model,
      receiverName: receiver.name,
      message: body.message.trim(),
      scheduledFor,
      expiresIn: durationMs,
      expiresAt: new Date(Date.now() + durationMs),
      ...(body.sport && { sport: body.sport }),
      ...(body.game && { game: body.game }),
      ...(body.venue && { venue: body.venue }),
      ...(body.platform && { platform: body.platform }),
    });
  }

  /** Everything the account is involved in, newest first. */
  async findAllFor(id) {
    return Request.find({ $or: [{ sender: id }, { receiver: id }] }).sort({ createdAt: -1 });
  }

  /** Unseen incoming requests that still need a decision — the notifications feed. */
  async findUnseenFor(id) {
    return Request.find({
      receiver: id,
      seen: false,
      status: { $nin: ['cancelled', 'expired'] },
    }).sort({ createdAt: -1 });
  }

  async findSentBy(id) {
    return Request.find({ sender: id }).sort({ createdAt: -1 });
  }

  async findReceivedBy(id) {
    return Request.find({ receiver: id }).sort({ createdAt: -1 });
  }

  /**
   * Applies a status change on behalf of `actorId`, enforcing who is allowed to
   * make it: the receiver accepts or rejects, the sender cancels, and only
   * while the request is still pending.
   */
  async updateStatus(requestId, status, actorId) {
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      throw ApiError.badRequest(`"${requestId}" is not a valid request id.`);
    }

    const request = await Request.findById(requestId);
    if (!request) throw ApiError.notFound('Request not found.');

    const isReceiver = String(request.receiver) === String(actorId);
    const isSender = String(request.sender) === String(actorId);

    if (!isReceiver && !isSender) {
      throw ApiError.forbidden('You are not part of this request.');
    }
    if (request.status !== 'pending') {
      throw ApiError.conflict(`This request has already been ${request.status}.`);
    }

    if (status === 'cancelled') {
      if (!isSender) throw ApiError.forbidden('Only the sender can cancel a request.');
    } else if (status === 'accepted' || status === 'rejected') {
      if (!isReceiver) throw ApiError.forbidden(`Only the receiver can ${status.slice(0, -2)} a request.`);
      request.seen = true;
    } else {
      throw ApiError.badRequest(`"${status}" is not a status you can set.`);
    }

    request.status = status;
    return request.save();
  }

  /** Marks incoming requests as seen once the notifications page has shown them. */
  async markSeen(id) {
    await Request.updateMany({ receiver: id, seen: false }, { $set: { seen: true } });
  }

  sentSummary(id) {
    return summarise('sender', id);
  }

  receivedSummary(id) {
    return summarise('receiver', id);
  }
}
