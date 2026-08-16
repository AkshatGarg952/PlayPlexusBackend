import jwt from 'jsonwebtoken';
import config from '../config/env.js';

/** Verifies a token and returns its payload, or throws. Shared with the socket layer. */
export const verifyToken = (token) => jwt.verify(token, config.jwtSecret);

/**
 * Requires a valid `Authorization: Bearer <token>` header and attaches the
 * decoded payload to `req.user`.
 */
const jwtAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.slice('Bearer '.length).trim();

  try {
    req.user = verifyToken(token);
    return next();
  } catch (error) {
    const expired = error.name === 'TokenExpiredError';
    return res.status(401).json({
      message: expired ? 'Session expired, please log in again' : 'Invalid token',
      code: expired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
    });
  }
};

export default jwtAuth;
