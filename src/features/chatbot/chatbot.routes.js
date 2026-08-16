import express from 'express';
import { ask } from './chatbot.controller.js';
import jwtAuth from '../../middleware/jwt.auth.js';

const chatBotRouter = express.Router();

chatBotRouter.post('/ask/:id', jwtAuth, ask);

export default chatBotRouter;
