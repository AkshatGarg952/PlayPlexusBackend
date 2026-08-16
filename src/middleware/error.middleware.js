import config from '../config/env.js';
import ApiError from '../utils/ApiError.js';

export const notFound = (req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} does not exist.` });
};

/**
 * Single place where errors become responses. Mongoose validation and duplicate
 * key errors are translated into 400/409 so clients get a usable message
 * instead of a raw driver dump.
 */
// eslint-disable-next-line no-unused-vars -- Express identifies error middleware by arity.
export const errorHandler = (error, req, res, next) => {
  let status = error.status || 500;
  let message = error.message || 'Something went wrong.';

  if (error.name === 'ValidationError') {
    status = 400;
    message = Object.values(error.errors)
      .map((detail) => detail.message)
      .join(' ');
  } else if (error.code === 11000) {
    status = 409;
    const field = Object.keys(error.keyValue ?? {})[0] ?? 'value';
    message = `That ${field} is already taken.`;
  } else if (error.name === 'CastError') {
    status = 400;
    message = `"${error.value}" is not a valid ${error.path}.`;
  }

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, error);
    if (config.isProduction) message = 'Something went wrong.';
  }

  res.status(status).json({
    message,
    ...(config.isProduction || error instanceof ApiError ? {} : { stack: error.stack }),
  });
};
