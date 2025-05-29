import chatR from "./chat.repository.js";
const chatRepository = new chatR();


export default class chatC{

    async fetch(req, res){
     try{
      const messages = await chatRepository.fetch(req.params.sId, req.params.rId);
      console.log(messages);
      res.status(200).send(messages);
     }
     catch(err){
        res.send(400).send(err.message);
     }
    }




}