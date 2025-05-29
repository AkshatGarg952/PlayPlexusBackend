import Request from "./request.schema.js";
import User from "../users/user.schema.js"
import Team from "../teams/team.schema.js"
import mongoose from "mongoose"
export default class requestR{

    async send(sId, rId, body){
      try{
        const dateTimeStr = body.dateTime; 
const [datePart, timePart] = dateTimeStr.split('T'); 
       let name;
       let receiverName;
       let user = await User.findById(sId);
       if(!user){
         user = await Team.findById(sId);
         name = user.name;
       } 
       else{
        name = user.username;
       }

       let user2 = await User.findById(rId);
       if(!user2){
         user2 = await Team.findById(rId);
         receiverName = user2.name;
       } 
       else{
        receiverName = user2.username;
       }

       const unitMultipliers = {
  seconds: 1000,
  minutes: 60 * 1000,
  hours: 60 * 60 * 1000,
};

const durationMs = body.expiryTime * unitMultipliers[body.expiryUnit];

const now = new Date();
  const expiresAt = new Date(now.getTime() + durationMs);

      const request = new Request({
       sender:sId,
       receiver:rId,
       message:body.message,
       senderName: name,
       time:timePart,
       expiresIn: durationMs,
       expiresAt: expiresAt,
       receiverName: receiverName,
       date: new Date(datePart),
       ...(body.sport && { sport: body.sport }),
       ...(body.game && { game: body.game }),
       ...(body.venue && { venue: body.venue }),
      });
      await request.save();
      return request;
      }
      catch(err){
        throw err;
      }
    }

    async accept(aId, rId){
      const request = await Request.findById(rId);
      request.responseId.push(aId);
      request.status="accepted";
      request.seen = true;
      await request.save();
    }

    async reject(aId, rId){
      const request = await Request.findById(rId);
      request.status="rejected";
      request.seen = true;
      await request.save();
    }

    async cancel(aId, rId){
      const request = await Request.findById(rId);
      request.status="cancelled";
      request.seen = true;
      await request.save();
    }

    
    async getAll(id){
      const requests = await Request.find({
        $or: [
          { receiver: id },
          { sender: id }
        ]
      });
    
      return requests;
    }

    async getAll2(id) {
      const requests = await Request.find({
        $and: [
          {
            $or: [
              { receiver: id },
            ]
          },
          { seen: false },
          { status: { $nin: ['cancelled', 'expired'] } }
        ]
      });
    
      return requests;
    }
    

    async sended(id){
      const requests = await Request.find({ sender: id });
    
      return requests;
    }

    async received(id){
      const requests = await Request.find({ receiver: id });
    
      return requests;
    }



    async sender(id) {
        const senderId = new mongoose.Types.ObjectId(id);
    
        const totalRequests = await Request.countDocuments({ sender: senderId });
    
        const statusCounts = await Request.aggregate([
            { $match: { sender: senderId } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);
    
        return {
            total: totalRequests,
            statusWise: statusCounts
        };
    }
    
    
    
        async receiver(id) {
          const receiverId = new mongoose.Types.ObjectId(id);


        
            const totalRequests = await Request.countDocuments({
                receiver: receiverId,
            });
        
            const statusCounts = await Request.aggregate([
                {
                    $match: {
                        receiver: receiverId,

                    }
                },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 }
                    }
                }
            ]);
        
            return {
                total: totalRequests,
                statusWise: statusCounts
            };
        }

        async update(status, id){
          const request = await Request.findById(id);
      request.status=status;
      if(status!=="cancelled"){
      request.seen = true;
      }
      return await request.save();
        }

  }


    