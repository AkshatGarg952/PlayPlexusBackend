import mongoose from 'mongoose';
import { createAccountSchema } from '../accounts/account.schema.js';

const userSchema = createAccountSchema({
  imageField: 'profileImage',
  fields: {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [50, 'Username cannot exceed 50 characters'],
    },
  },
});

const User = mongoose.model('User', userSchema);
export default User;
