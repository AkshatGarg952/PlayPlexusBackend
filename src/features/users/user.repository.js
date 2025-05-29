import User from "./user.schema.js";
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
export default class UserR{

    async register (user){
        let old = await User.findOne({email:user.email
          });
        if(old){
            throw new Error("User already exists!");
        }

        old = await User.findOne({username:user.username});
        if(old){
            throw new Error("User with this username already exists!");
        }
        const newUser = new User({
            name: user.name,
            username: user.username,
            password: user.password,
            email: user.email,
            phone: user.phone,
            location: user.location,
            ...(user.bio && { bio: user.bio }),
            ...(user.profileImage && { profileImage: user.profileImage }),
            ...(user.sports && { sports: user.sports }),
            ...(user.onlineGames && { onlineGames: user.onlineGames }),
          });
          

       try{
        const saltRounds = 12;
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(newUser.password, salt);
        newUser.password = hash;
        const savedUser = await newUser.save();
        return savedUser;
       }
       catch(err){
       console.error("Error saving user : ", err);
       throw err;
    }
    }

    async login(email, pass){
        const user = await User.findOne({ email: email }); 
        if (!user) {
            throw new Error("User not found! Please register first.");
        }
        const isMatch = await bcrypt.compare(pass, user.password);
        if (!isMatch) {
            throw new Error("Invalid credentials! Please check your email or password.");
        }
        return user; 
    }

    async details(id){
        try{
        const user = await User.findById(id);
        if(user){
            return user;
        }
        else{
            throw new Error("Cannot find the given user!");        
        }
    }

    catch(err){
        throw new Error("Make sure you have entered the right ID"); 
}
    
    } 

    async getAll(id){
        let filter = {};
            if (id && mongoose.Types.ObjectId.isValid(id)) {
                filter = { _id: { $ne: new mongoose.Types.ObjectId(id) } };
            }
        return await User.find(filter);
    }

    async update(id, user){
        const userF = await User.findById(id);
        if(userF){
        Object.assign(userF, user);
         const updatedUser = await userF.save();
         return updatedUser;
        }
        else{
            throw new Error("Cannot find given user!");
        }
    }

    async filterByLocation(location){
        try{
            const users = await User.find({location:location.toLowerCase()});
            return users;
        }
        catch(err){
            throw err;
        }
    }

   async filter(sport, location, id) {
    const query = {};


    
    if (sport && sport.trim()) {
        const sportRegex = new RegExp(sport.trim(), 'i');
        query.$or = [
            { sports: { $regex: sportRegex } },
            { 'onlineGames.gameName': { $regex: sportRegex } }
        ];
    }

    
    if (location && location.trim()) {
        const locationRegex = new RegExp(location.trim(), 'i');
        query.location = { $regex: locationRegex };
    }

    try {
        const users = await User.find(query);
        return users;
    } catch (err) {
        console.error("Error fetching users with filter:", err);
        throw err;
    }
}

    
    

 
}