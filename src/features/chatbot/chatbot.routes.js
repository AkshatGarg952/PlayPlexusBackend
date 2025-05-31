import express from "express";
import ask from "./chatbot.controller.js";
const chatBotRouter = express.Router();
import jwtAuth from "../../middleware/jwt.auth.js";


chatBotRouter.post("/ask/:id",jwtAuth, (req,res)=>{
    ask(req, res);
});

export default chatBotRouter;
