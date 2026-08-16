import mongoose from 'mongoose';
import ApiError from '../../utils/ApiError.js';

/**
 * Data access for an account model (User or Team). Both models are queried the
 * same way, so this is written once and configured per model rather than
 * duplicated between user.repository.js and team.repository.js.
 *
 * @param {object}   options
 * @param {import('mongoose').Model} options.Model
 * @param {string}   options.label        Human label used in error messages ("User" / "Team").
 * @param {string[]} options.uniqueFields Fields that must be unique besides the email.
 */
export const createAccountRepository = ({ Model, label, uniqueFields = [] }) => ({
  async register(data) {
    const conflicts = [{ field: 'email', message: `${label} with this email already exists!` }, ...uniqueFields];

    for (const { field, message } of conflicts) {
      if (data[field] == null) continue;
      const existing = await Model.findOne({ [field]: data[field] });
      if (existing) throw ApiError.conflict(message);
    }

    // `save()` (not `create`) so the password-hashing pre-save hook runs.
    const account = new Model(data);
    await account.save();
    return account;
  },

  async login(email, password) {
    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required.');
    }

    const account = await Model.findOne({ email: String(email).toLowerCase() }).select('+password');
    // Same message either way so the endpoint can't be used to enumerate accounts.
    const invalid = ApiError.unauthorized('Invalid credentials! Please check your email or password.');

    if (!account) throw invalid;
    if (!(await account.verifyPassword(password))) throw invalid;

    return account;
  },

  async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest(`"${id}" is not a valid ${label.toLowerCase()} id.`);
    }

    const account = await Model.findById(id);
    if (!account) throw ApiError.notFound(`Cannot find the given ${label.toLowerCase()}!`);
    return account;
  },

  /** Every account except the caller's own, so users never see themselves in search results. */
  async findAllExcept(id) {
    const filter = mongoose.Types.ObjectId.isValid(id) ? { _id: { $ne: id } } : {};
    return Model.find(filter).sort({ createdAt: -1 });
  },

  async update(id, changes) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest(`"${id}" is not a valid ${label.toLowerCase()} id.`);
    }

    // The password field is `select: false`, but it is `required`, so it has to
    // be loaded for validation to pass on save().
    const account = await Model.findById(id).select('+password');
    if (!account) throw ApiError.notFound(`Cannot find the given ${label.toLowerCase()}!`);

    Object.assign(account, changes);
    await account.save();
    return account;
  },

  async findByLocation(location) {
    if (!location || !location.trim()) return [];
    return Model.find({ location: String(location).trim().toLowerCase() });
  },

  /**
   * Search by sport/game and location. Both terms are optional — "all" and
   * "null" are accepted as "no filter" so the chatbot can build URLs without
   * knowing whether the user supplied every part.
   */
  async search({ activity, location, excludeId }) {
    const query = {};
    const isWildcard = (value) =>
      !value || !String(value).trim() || ['all', 'null', 'undefined'].includes(String(value).trim().toLowerCase());

    if (!isWildcard(activity)) {
      const pattern = new RegExp(escapeRegex(String(activity).trim()), 'i');
      query.$or = [{ sports: pattern }, { onlineGames: pattern }];
    }

    if (!isWildcard(location)) {
      query.location = new RegExp(escapeRegex(String(location).trim()), 'i');
    }

    if (mongoose.Types.ObjectId.isValid(excludeId)) {
      query._id = { $ne: excludeId };
    }

    return Model.find(query).sort({ createdAt: -1 });
  },
});

/** User input goes straight into a RegExp, so metacharacters must be neutralised. */
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default createAccountRepository;
