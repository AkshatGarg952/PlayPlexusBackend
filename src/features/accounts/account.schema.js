import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

/** Lower-cases and trims every entry of a string array, tolerating bad input. */
const normaliseTags = (value) => {
  if (!Array.isArray(value)) return value;
  return value.map((item) => String(item).trim().toLowerCase()).filter(Boolean);
};

const shortText = (label) => ({
  type: String,
  required: true,
  trim: true,
  minlength: [3, `${label} must be at least 3 characters`],
  maxlength: [50, `${label} cannot exceed 50 characters`],
});

const tagList = {
  type: [String],
  default: [],
  set: normaliseTags,
};

/**
 * Users and teams are the same kind of thing as far as auth, search and
 * messaging are concerned: a named account with credentials, a location, an
 * avatar and a list of sports/games. This builds that common schema; each model
 * only supplies the handful of fields that genuinely differ.
 *
 * @param {object} options
 * @param {object} options.fields       Model-specific field definitions.
 * @param {string} options.imageField   Name of the avatar field ("profileImage" / "logo").
 */
export const createAccountSchema = ({ fields = {}, imageField }) => {
  const schema = new mongoose.Schema(
    {
      name: shortText('Name'),

      location: {
        ...shortText('Location'),
        lowercase: true,
      },

      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
      },

      password: {
        type: String,
        required: true,
        minlength: [6, 'Password must be at least 6 characters'],
        // Never loaded unless a query explicitly asks for it, so a hash can't
        // leak through a list endpoint by accident.
        select: false,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },

      [imageField]: {
        type: String,
      },

      bio: {
        type: String,
        default: '',
        maxlength: [500, 'Bio cannot exceed 500 characters'],
      },

      sports: tagList,
      onlineGames: tagList,

      ...fields,
    },
    { timestamps: true }
  );

  // Hash whenever the password changes — on registration *and* on profile
  // update. Previously updates stored the new password in plain text.
  schema.pre('save', async function hashPassword(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    next();
  });

  schema.methods.verifyPassword = function verifyPassword(candidate) {
    return bcrypt.compare(candidate, this.password);
  };

  // Belt and braces: even if a query selects the password, it never serialises.
  const stripPassword = (_doc, ret) => {
    delete ret.password;
    return ret;
  };
  schema.set('toJSON', { transform: stripPassword });
  schema.set('toObject', { transform: stripPassword });

  return schema;
};

export default createAccountSchema;
