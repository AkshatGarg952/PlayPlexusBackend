import express from 'express';
import ChatController from './chat.controller.js';
import jwtAuth from '../../middleware/jwt.auth.js';

const chatRouter = express.Router();
const controller = new ChatController();

chatRouter.get('/fetch/:sId/:rId', jwtAuth, controller.fetch);

export default chatRouter;
