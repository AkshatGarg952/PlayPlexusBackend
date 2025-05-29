import Team from "./team.schema.js";
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
export default class TeamR{

    async register (team){
        let old = await Team.findOne({email:team.email
          });
        if(old){
            throw new Error("Team already exists!");
        }
        
        old = await Team.findOne({name:team.name});

        if(old){
            throw new Error("Team with this name already exists!");
        }        
       const newTeam = new Team({
           name:team.name,
           password:team.password,
           leader:team.leader,
           phone:team.phone,
           location:team.location,
           email:team.email,
           ...(team.bio && { bio: team.bio }),
           ...(team.logo && { logo: team.logo }),
           ...(team.sports && { sports: team.sports }),
           ...(team.onlineGames && { onlineGames: team.onlineGames }),
       })

       try{
        const saltRounds = 12;
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(newTeam.password, salt);
        newTeam.password = hash;
        const savedTeam = await newTeam.save();
        return savedTeam;
       }
       catch(err){
       console.error("Error saving team : ", err);
       throw err;
    }
    }

    async login(email, pass){
        const team = await Team.findOne({ email: email }); 
        if (!team) {
            throw new Error("User not found! Please register first.");
        }
        const isMatch = await bcrypt.compare(pass, team.password);
        if (!isMatch) {
            throw new Error("Invalid credentials! Please check your email or password.");
        }
        return team; 
    }

    async details(id){
        try{
            
        const team = await Team.findById(id);
        if(team){
            return team;
        }
        else{
            throw new Error("Cannot find the given team!");        
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
        return await Team.find(filter);
    }

    async update(id, team){
        const teamF = await Team.findById(id);
        if(teamF){
        Object.assign(teamF, team);
         const updatedTeam = await teamF.save();
         return updatedTeam;
        }
        else{
            throw new Error("Cannot find given team!");
        }
    }

    async filterByLocation(location){
        try{
            const teams = await Team.find({location:location.toLowerCase()});
            return teams;
        }
        catch(err){
            throw err;
        }
    }

    async filter(sport, loca, id){
        let filterr = {};
                   
        try{
            const teams = await Team.find({$or:[{sports:sport.toLowerCase()}, {onlineGames:sport.toLowerCase()}], location:loca, ...filterr});
            return teams;
        }
        catch(err){
            throw err;
        }
    }

    

    

    
}