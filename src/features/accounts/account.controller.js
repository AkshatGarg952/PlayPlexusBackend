import jwt from 'jsonwebtoken';
import config from '../../config/env.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import parseList from '../../utils/parseList.js';

const signToken = (id) => jwt.sign({ id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

/**
 * HTTP layer for an account model. Registration, login, lookup, update and
 * search are identical for users and teams apart from the field list and the
 * key each response is wrapped in, so both routers share this factory.
 *
 * @param {object}   options
 * @param {object}   options.repository    From createAccountRepository.
 * @param {string}   options.resourceKey   Response envelope key ("user" / "team").
 * @param {string}   options.imageField    Avatar field name ("profileImage" / "logo").
 * @param {string[]} options.textFields    Plain string fields accepted from the client.
 */
export const createAccountController = ({ repository, resourceKey, imageField, textFields }) => {
  /** Picks known fields off the request body; ignores anything else a client sends. */
  const collectFields = (req, { partial }) => {
    const data = {};

    for (const field of textFields) {
      const value = req.body[field];
      // On update, only fields actually present are touched. On register, every
      // field is copied through so schema validation reports what's missing.
      if (value !== undefined && (!partial || String(value).trim() !== '')) {
        data[field] = value;
      }
    }

    for (const field of ['sports', 'onlineGames']) {
      const parsed = parseList(req.body[field]);
      if (parsed !== undefined) data[field] = parsed;
    }

    if (req.file?.path) {
      data[imageField] = req.file.path;
    }

    return data;
  };

  return {
    register: asyncHandler(async (req, res) => {
      const account = await repository.register(collectFields(req, { partial: false }));

      res.status(201).json({
        [resourceKey]: account.toJSON(),
        token: signToken(account._id),
      });
    }),

    login: asyncHandler(async (req, res) => {
      const account = await repository.login(req.body.email, req.body.password);

      res.status(200).json({
        [resourceKey]: account.toJSON(),
        token: signToken(account._id),
      });
    }),

    getDetails: asyncHandler(async (req, res) => {
      const account = await repository.findById(req.params.id);
      res.status(200).json(account);
    }),

    getAll: asyncHandler(async (req, res) => {
      const accounts = await repository.findAllExcept(req.params.id);
      res.status(200).json(accounts);
    }),

    update: asyncHandler(async (req, res) => {
      // A token only authorises edits to its own account.
      if (req.user.id !== req.params.id) {
        throw ApiError.forbidden('You can only update your own profile.');
      }

      const account = await repository.update(req.params.id, collectFields(req, { partial: true }));
      res.status(200).json(account);
    }),

    filterByLocation: asyncHandler(async (req, res) => {
      const accounts = await repository.findByLocation(req.params.location);
      res.status(200).json(accounts);
    }),

    filter: asyncHandler(async (req, res) => {
      const accounts = await repository.search({
        activity: req.params.sport,
        location: req.params.loca,
        excludeId: req.params.id,
      });
      res.status(200).json(accounts);
    }),
  };
};

export default createAccountController;
