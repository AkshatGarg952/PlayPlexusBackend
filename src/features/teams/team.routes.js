import express from "express";
import teamC from "./team.controller.js";
import {upload2} from "../../middleware/multer.middleware.js";
import jwtAuth from "../../middleware/jwt.auth.js";

const teamRouter = express.Router();
const teamController = new teamC();

teamRouter.post("/register",upload2.single('logo'), (req,res)=>{
    console.log(req.body);
    teamController.register(req,res);
});

teamRouter.post("/login", (req,res)=>{
    teamController.login(req,res);
});

teamRouter.get("/details/:id",jwtAuth, (req,res)=>{
    teamController.getDetails(req,res);
});

teamRouter.get("/allTeams/:id",jwtAuth, (req,res)=>{
    teamController.getAll(req,res);
});

teamRouter.post("/update/:id",jwtAuth, upload2.single('logo'), (req,res)=>{
    teamController.update(req,res);
});


teamRouter.get("/filterbyLocation/:location",jwtAuth, (req, res)=>{
    teamController.filterByLocation(req, res);
})

teamRouter.get("/filter/:sport/:loca/:id",jwtAuth, (req, res)=>{
    teamController.filter(req, res);
})

export default teamRouter;
