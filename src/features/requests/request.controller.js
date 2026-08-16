import RequestRepository from './request.repository.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { accountRoom } from '../../realtime/socket.js';

const repository = new RequestRepository();

/** Only the account named in the token may read or act on its own requests. */
const assertSelf = (req, id) => {
  if (req.user.id !== id) {
    throw ApiError.forbidden('You can only access your own requests.');
  }
};

/**
 * Pushes a status change to both participants. Emitting from here (rather than
 * trusting a client-sent socket event) means the broadcast can only follow a
 * change the server has already authorised.
 */
const broadcastStatus = (req, request) => {
  const io = req.app.get('io');
  if (!io) return;

  const payload = { id: String(request._id), status: request.status, seen: request.seen };

  io.to(accountRoom(request.sender)).emit('receive', payload);
  io.to(accountRoom(request.receiver)).emit('receive', payload);
};

export default class RequestController {
  send = asyncHandler(async (req, res) => {
    assertSelf(req, req.params.sId);

    const request = await repository.send(req.params.sId, req.params.rId, req.body);

    // Let the receiver's open tabs show the new request without a refresh.
    req.app.get('io')?.to(accountRoom(request.receiver)).emit('requestCreated', request.toJSON());

    res.status(201).json(request);
  });

  getAll = asyncHandler(async (req, res) => {
    assertSelf(req, req.params.id);
    res.status(200).json(await repository.findAllFor(req.params.id));
  });

  getUnseen = asyncHandler(async (req, res) => {
    assertSelf(req, req.params.id);
    res.status(200).json(await repository.findUnseenFor(req.params.id));
  });

  getSent = asyncHandler(async (req, res) => {
    assertSelf(req, req.params.id);
    res.status(200).json(await repository.findSentBy(req.params.id));
  });

  getReceived = asyncHandler(async (req, res) => {
    assertSelf(req, req.params.id);
    res.status(200).json(await repository.findReceivedBy(req.params.id));
  });

  updateStatus = asyncHandler(async (req, res) => {
    const request = await repository.updateStatus(req.params.id, req.body.status, req.user.id);
    broadcastStatus(req, request);
    res.status(200).json(request);
  });

  markSeen = asyncHandler(async (req, res) => {
    assertSelf(req, req.params.id);
    await repository.markSeen(req.params.id);
    res.status(204).end();
  });

  senderSummary = asyncHandler(async (req, res) => {
    assertSelf(req, req.params.id);
    res.status(200).json(await repository.sentSummary(req.params.id));
  });

  receiverSummary = asyncHandler(async (req, res) => {
    assertSelf(req, req.params.id);
    res.status(200).json(await repository.receivedSummary(req.params.id));
  });
}
