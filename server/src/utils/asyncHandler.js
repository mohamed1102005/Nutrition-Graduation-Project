// asyncHandler.js — Express 4 does not catch errors thrown inside async
// handlers: the request would simply hang. Wrap async routes with this so any
// failure reaches the normal error handler instead.

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
