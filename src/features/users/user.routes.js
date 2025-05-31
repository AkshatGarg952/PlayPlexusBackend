import express from "express";
import userC from "./user.controller.js";
import {upload1} from "../../middleware/multer.middleware.js";
import jwtAuth from "../../middleware/jwt.auth.js";
const userRouter = express.Router();
const userController = new userC();

userRouter.post("/register", async (req, res) => {
  try {
    await upload1.single('profileImage')(req, res, (err) => {
      if (err) {
        console.error('Multer/Cloudinary Error:', err.message, err.stack);
        return res.status(400).json({ error: err.message });
      }
      console.log('Request Body:', req.body);
      console.log('Uploaded File:', req.file);
      userController.register(req, res);
    });
  } catch (err) {
    console.error('Route Error:', err.message, err.stack);
    res.status(500).json({ error: 'Server error' });
  }
});


userRouter.post("/login", (req,res)=>{
    console.log(req.body);
    userController.login(req,res);
});

userRouter.get("/details/:id",jwtAuth, (req,res)=>{
    userController.getDetails(req,res);
});

userRouter.get("/allUsers/:id",jwtAuth, (req,res)=>{
    userController.getAll(req,res);
});

userRouter.post("/update/:id",jwtAuth, upload1.single('profileImage'), (req,res)=>{
    userController.update(req,res);
});


userRouter.get("/filterbyLocation/:location",jwtAuth, (req, res)=>{
    userController.filterByLocation(req, res);
})

userRouter.get("/filter/:sport/:loca/:id",jwtAuth, (req, res)=>{
   userController.filter(req, res);
})







export default userRouter;
