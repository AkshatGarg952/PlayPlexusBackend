import mongoose from 'mongoose';
import Schema from 'mongoose';
const requestSchema = new mongoose.Schema({
  required:{type: Number, default:1},
  senderName: {type:String},
  receiverName: {type:String},
  sender: { refPath: 'responses.responseType', type: Schema.Types.ObjectId, },
  receiver: { refPath: 'responses.responseType', type: Schema.Types.ObjectId },
  message: { type: String },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'expired', 'cancelled'], default: 'pending' },
  seen: { type: Boolean, default: false },
  venue:{type:String},
  date:{type:Date},
  responseId:[{refPath: 'responses.responseType', type: Schema.Types.ObjectId,}],
  time:{type:String},
  sport:{type:String},
  game:{type:String},
   expiresIn: { type: Number },

expiresAt: { type: Date },
  responses: [{
    responseType: {
      type: String,
      required: true,
      enum: ['Team', 'User'] 
    }}],
  
});

const Request = mongoose.model('Request', requestSchema);
export default Request;

