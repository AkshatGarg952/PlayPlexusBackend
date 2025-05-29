import mongoose from "mongoose";
import Schema from 'mongoose';
const messageSchema = new mongoose.Schema({
  senderId: {refPath: 'responses.responseType', type: Schema.Types.ObjectId,required: true
  },
  receiverId: {
    refPath: 'responses.responseType', type: Schema.Types.ObjectId,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  responses: [{
    responseType: {
      type: String,
      required: true,
      enum: ['Team', 'User'] 
    }}],
});

const Message = mongoose.model('Message', messageSchema);
export default Message;