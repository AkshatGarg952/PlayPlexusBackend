import express from 'express';
import RequestController from './request.controller.js';
import jwtAuth from '../../middleware/jwt.auth.js';

const requestRouter = express.Router();
const controller = new RequestController();

requestRouter.use(jwtAuth);

requestRouter.post('/send/:sId/:rId', controller.send);

requestRouter.get('/details/:id', controller.getAll);
requestRouter.get('/newdetails/:id', controller.getUnseen);
requestRouter.get('/sended/:id', controller.getSent);
requestRouter.get('/received/:id', controller.getReceived);

requestRouter.post('/update/:id', controller.updateStatus);
requestRouter.post('/seen/:id', controller.markSeen);

requestRouter.get('/sender/:id', controller.senderSummary);
requestRouter.get('/receiver/:id', controller.receiverSummary);

export default requestRouter;
