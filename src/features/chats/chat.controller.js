import ChatRepository from './chat.repository.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';

const repository = new ChatRepository();

export default class ChatController {
  fetch = asyncHandler(async (req, res) => {
    const { sId, rId } = req.params;

    // A conversation is only readable by one of its two participants.
    if (req.user.id !== sId && req.user.id !== rId) {
      throw ApiError.forbidden('You are not part of this conversation.');
    }

    res.status(200).json(await repository.history(sId, rId));
  });
}
