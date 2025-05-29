import Message from "./chat.schema.js";
export default class chatR{


    async fetch(senderId, receiverId){

        const messages = await Message.find({
                    $or: [
                        { senderId, receiverId },
                        { senderId: receiverId, receiverId: senderId }
                    ]
                }).sort({ createdAt: 1 });
        
                return messages;
    }
    

    

    

    
}