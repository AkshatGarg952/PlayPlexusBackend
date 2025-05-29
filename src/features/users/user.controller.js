import userR from "./user.repository.js";
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
const userRepository = new userR();
dotenv.config();
export default class userC{

  async register(req, res) {
    let {
      name, email, password, username, phone, location, bio, sports, onlineGames} = req.body;


    if (sports && typeof sports === 'string') {
      sports = sports.split(',').map(item => item.trim());
    }

    if (onlineGames && typeof onlineGames === 'string') {
      onlineGames = onlineGames.split(',').map(item => item.trim());
    }
  
  
    const User = {
      name,
      username,
      phone,
      email,
      password,
      location,
      bio,
      sports,
      onlineGames
    };
  
    if (req.file) {
      const imageUrl = req.file.path;;
      User.profileImage = imageUrl;
    }
  
    try {
      console.log(User);
      const user = await userRepository.register(User);
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
      });
  
      res.status(200).send(user);
    } catch (err) {
      res.status(400).send(err);
    }
  }
  

    async login(req, res){
      console.log(req);
        const {email, password} = req.body;
       
        try{
          const user = await userRepository.login(email,password);
          const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
                         
                     res.cookie("token", token, {
                        httpOnly: true, 
                        secure: true,
                        sameSite: "Strict", 
                    });
        res.status(200).send(user);
        }
        catch(err){
            res.status(400).send(err);
        }
    }

    
    async getDetails(req, res){
        const id = req.params.id;
        try{
            const user = await userRepository.details(id);
            console.log(user);
            res.status(201).send(user);
        }
        catch(err){
            res.status(400).send(err.message);
        }
    }


    async getAll(req, res){

        try{
        const users = await userRepository.getAll(req.params.id);
        res.status(201).send(users);
        
        }
        catch(err){
          res.status(500).send(err.message);
        }
    }

    async update(req, res){
        const id = req.params.id;
        console.log(req.body);
        
        try{
            const User = {};
    if (req.body.name) User.name = req.body.name;
    if (req.body.location) User.location = req.body.location;
    if (req.body.username) User.username = req.body.username;
    if (req.body.bio) User.bio = req.body.bio;
    if (req.body.phone) User.phone = req.body.phone;
    if (req.body.email) User.email = req.body.email;

    if (req.body.sports && typeof req.body.sports === 'string'){ 
      req.body.sports = req.body.sports.split(',').map(item => item.trim());
      User.sports = req.body.sports;
    }
    if (req.body.onlineGames && typeof req.body.onlineGames === 'string') {
      req.body.onlineGames = req.body.onlineGames.split(',').map(item => item.trim());
      User.onlineGames = req.body.onlineGames;
    }
    if (req.body.password) {
    User.password = req.body.password; 
    }
    if (req.file && req.file.path) {
      User.profileImage = req.file.path;
    }

    console.log(User);
    const newUser = await userRepository.update(id,User);
    res.status(200).send(newUser);
        }

        catch(err){
            console.log(err.message);
            res.status(400).send(err.message);
        }

    }

    async filterByLocation(req, res){
        try{
          const users = await userRepository.filterByLocation(req.params.location);
          res.status(200).send(users);
        }

        catch(err){
          res.status(400).send(err.message);
        }
    }

    async filter(req, res){
        try{
          console.log(req.params);
            const users = await userRepository.filter(req.params.sport, req.params.loca, req.params.id);
            console.log("le re lund ke", users);
            res.status(200).send(users);
          }
  
          catch(err){
            res.status(400).send(err.message);
          }
    }

    

    
}