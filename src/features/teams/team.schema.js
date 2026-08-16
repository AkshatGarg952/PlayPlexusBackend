import mongoose from 'mongoose';
import { createAccountSchema } from '../accounts/account.schema.js';

const teamSchema = createAccountSchema({
  imageField: 'logo',
  fields: {
    leader: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, 'Leader name must be at least 3 characters'],
      maxlength: [50, 'Leader name cannot exceed 50 characters'],
    },
  },
});

const Team = mongoose.model('Team', teamSchema);
export default Team;
