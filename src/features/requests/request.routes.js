import express from "express";
import requestC from "./request.controller.js";
const requestRouter = express.Router();
const requestController = new requestC();
import jwtAuth from "../../middleware/jwt.auth.js";

requestRouter.post("/send/:sId/:rId", jwtAuth, (req,res)=>{
    console.log(req.body);
    requestController.send(req,res);
});

requestRouter.post("/send2/:sId/:rId", jwtAuth, (req,res)=>{
    requestController.send2(req,res);
});

requestRouter.get('/details/:id', jwtAuth, (req, res)=>{
    requestController.getAll(req, res);
})

requestRouter.get('/newdetails/:id', jwtAuth, (req, res)=>{
    requestController.getAll2(req, res);
})

requestRouter.get('/sended/:id', jwtAuth, (req, res)=>{
    requestController.sended(req, res);
})

requestRouter.get('/received/:id', jwtAuth, (req, res)=>{
    requestController.received(req, res);
})


requestRouter.post('/update/:id', jwtAuth, (req, res)=>{
    requestController.update(req, res);
})


requestRouter.get('/accept/:aId/:rId', jwtAuth, (req, res)=>{
    requestController.accept(req, res);
})

requestRouter.get('/reject/:aId/:rId', jwtAuth, (req, res)=>{
    requestController.reject(req, res);
})

requestRouter.get('/cancel/:aId/:rId', jwtAuth, (req, res)=>{
    requestController.cancel(req, res);
})


requestRouter.get("/sender/:id", jwtAuth, (req, res)=>{
    requestController.sender(req, res);
});

requestRouter.get("/receiver/:id", jwtAuth, (req, res)=>{
    requestController.receiver(req, res);
})





export default requestRouter;
