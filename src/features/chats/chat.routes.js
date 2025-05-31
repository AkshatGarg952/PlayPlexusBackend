import express from "express";
import chatC from "./chat.controller.js";
import jwtAuth from "../../middleware/jwt.auth.js";

const chatRouter = express.Router();
const chatController = new chatC();

chatRouter.get("/fetch/:sId/:rId",jwtAuth, (req,res)=>{
    chatController.fetch(req,res);
});

export default chatRouter;
