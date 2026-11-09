// errorHandler.js — Global Express error-handling middleware.
//
// Any route can call next(err) (or throw inside a handler) and this
// function will format a consistent JSON error response so the client always
// gets the same shape: { "error": { "code": "...", "message": "..." } }.
//
// Express recognises an error-handling middleware by the 4-argument signature.
// Do NOT rename or remove `next` even though it isn't used — Express needs it.

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  const status = err.status ?? 500

  // Only unexpected failures are worth a stack trace. Deliberate 4xx errors
  // (e.g. SLOT_TAKEN) are normal business outcomes.
  if (status >= 500) console.error(err)

  // Never leak internal details (SQL text, file paths) on a server error.
  const code = status >= 500 ? 'INTERNAL_ERROR' : (err.code ?? 'ERROR')
  const message = status >= 500 ? 'An unexpected error occurred.' : (err.message ?? 'Request failed.')

  res.status(status).json({ error: { code, message } })
}
