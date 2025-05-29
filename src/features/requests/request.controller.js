import requestR from "./request.repository.js";
const requestRepository = new requestR();

export default class requestC {

    async send(req, res){
        try{
            const {sId, rId} = req.params;
            await requestRepository.send(sId, rId, req.body);
            res.status(200).send("Request Sended Successfuly!");
        }
        catch(err){
            res.status(401).send(err.message);
        }
    }

    async send2(req, res){
        try{
            const {sId, rId} = req.params;
            await requestRepository.send(sId, rId, req.body);
            res.redirect(`/allTeams/${sId}/${sId}`);
        }
        catch(err){
            res.status(401).send(err.message);
        }
    }

    async getAll(req, res){
        const requests = await requestRepository.getAll(req.params.id);
        res.status(201).send(requests);
    }

    async getAll2(req, res){
        const requests = await requestRepository.getAll2(req.params.id);
        res.status(201).send(requests);
    }

    async sended(req, res){
        const requests = await requestRepository.sended(req.params.id);
        res.status(201).send(requests);
    }

    async received(req, res){
        const requests = await requestRepository.received(req.params.id);
        res.status(201).send(requests);
    }

    async accept(req, res){
        await requestRepository.accept(req.params.aId, req.params.rId);
        res.status(201).send("Accepted the request!");
    }

    async reject(req, res){
        await requestRepository.reject(req.params.aId, req.params.rId);
        res.status(201).send("Rejected the request!");
    }


    async cancel(req, res){
        await requestRepository.cancel(req.params.aId, req.params.rId);
        res.status(201).send("Cancelled the request!");
    }

    async sender(req, res){
        const ans = await requestRepository.sender(req.params.id);
        res.status(201).send(ans);
      }
  
      async receiver(req, res){
        const ans = await requestRepository.receiver(req.params.id);
        res.status(201).send(ans);
      }

       async update(req, res){
        const requests = await requestRepository.update(req.body.status, req.params.id);
        res.status(201).send(requests);
    }
    

    
}
