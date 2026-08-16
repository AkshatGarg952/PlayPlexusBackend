/**
 * Wraps an async route handler so a rejected promise reaches Express' error
 * middleware instead of hanging the request. Replaces the try/catch that used
 * to be copy-pasted into every controller method.
 */
const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

export default asyncHandler;
