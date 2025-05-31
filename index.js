import express from 'express';
import connectDB from "./src/database/mongoose.js";
import userRouter from './src/features/users/user.routes.js';
import teamRouter from './src/features/teams/team.routes.js';
import requestRouter from './src/features/requests/request.routes.js';
import chatRouter from './src/features/chats/chat.routes.js';
import chatBotRouter from './src/features/chatbot/chatbot.routes.js';
import dotenv from 'dotenv';
import User from "./src/features/users/user.schema.js"
import Team from "./src/features/teams/team.schema.js"
import cookieParser from "cookie-parser";
import http from 'http';
import { Server } from 'socket.io';
import Message from "./src/features/chats/chat.schema.js"
import Request from "./src/features/requests/request.schema.js"
import {startExpiryJob} from "./src/features/requests/expiration.js";
import cors from 'cors'


dotenv.config();
const app = express();
app.use(cookieParser());
app.use(cors({
  origin: 'https://play-plexus-frontend.vercel.app',
  credentials: true
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/api/users', userRouter);
app.use('/api/teams', teamRouter);
app.use('/api/requests', requestRouter);
app.use('/api/chats', chatRouter);
app.use('/api/chatBot', chatBotRouter);



const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'https://play-plexus-frontend.vercel.app', 
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});


io.on('connection', (socket) => {
  console.log('New Socket.IO connection:', socket.id);

  socket.on('joinRoom', (roomId) => {
    if (!roomId || typeof roomId !== 'string') return;
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room: ${roomId}`);
  });

  socket.on('sendMessage', async (message, senderId, receiverId, roomId) => {
    console.log('Received sendMessage:', { message, senderId, receiverId, roomId });
    try {
      if (!message || !senderId || !receiverId || !roomId) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }
      const sender = (await User.findById(senderId)) || (await Team.findById(senderId));
      const receiver = (await User.findById(receiverId)) || (await Team.findById(receiverId));
      if (!sender || !receiver) {
        socket.emit('error', { message: 'Sender or receiver not found' });
        return;
      }
      const m = new Message({ message, senderId, receiverId });
      await m.save();
      io.to(roomId).emit('receiveMessage', m);
      console.log('Emitted receiveMessage to room:', roomId);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Server error' });
    }
  });

  socket.on('requestAction', async ({ action, requestId: rId }) =>{
       if (action === 'accept') {
    const request = await Request.findById(rId);
    request.status = 'accepted';
    request.seen = true;
    await request.save();
     io.emit('receive', {status: request.status,id: request._id});
  }

  else if(action === 'reject'){
    const request = await Request.findById(rId);
    request.status = 'rejected';
    request.seen = true;
    await request.save();
     io.emit('receive', {status: request.status,id: request._id});
  }

  else if(action === 'cancel'){
    const request = await Request.findById(rId);
    request.status = 'cancelled';
    await request.save();
      io.emit('receive', {status: request.status, id: request._id});
  }


  })

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

server.listen(process.env.PORT_NO, () => {
    connectDB();
    startExpiryJob();
});
