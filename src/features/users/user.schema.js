import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: [3, 'Name must be at least 3 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },

  username: {
    type: String,
    required: true,
    trim: true,
    minlength: [3, 'Name must be at least 3 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },

  location: {
    type: String,
    required: true,
    trim: true,
    lowercase:true,
    minlength: [3, 'Location must be at least 3 characters'],
    maxlength: [50, 'Location cannot exceed 50 characters']
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },

  password: {
    type: String,
    required: true,
    minlength: [6, 'Password must be at least 6 characters']
  },

  phone: {
    type: String,
    trim: true,
    required:true,
    default: ""
  },

  profileImage: {
    type: String,
  },

  bio: {
    type: String,
    default: ""
  },

  sports: {
    type: [String],
    default: [],
    set: arr => arr.map(sport => sport.trim().toLowerCase())
  },

  onlineGames: {
    type: [String],
    default: [],
    set: arr => arr.map(game => game.trim().toLowerCase())
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);
export default User;
