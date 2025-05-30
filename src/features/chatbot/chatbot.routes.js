import express from "express";
import ask from "./chatbot.controller.js";
const chatBotRouter = express.Router();
import jwtAuth from "../../middleware/jwt.auth.js";


chatBotRouter.post("/ask/:uId/:tId", (req,res)=>{
    ask(req, res);
});

export default chatBotRouter;
