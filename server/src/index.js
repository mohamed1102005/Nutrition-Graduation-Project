// index.js — Entry point. Imports the configured app and starts listening.
// Run via: node --watch server/src/index.js   (or npm run dev from root)

import app from './app.js'
import { startBookingLifecycleJob } from './services/bookingLifecycle.js'

// Refuse to start with a missing or placeholder signing secret: anyone who knows
// the placeholder could forge a login token.
const secret = process.env.JWT_SECRET
if (!secret) {
  console.error('JWT_SECRET is not set. Add it to server/.env before starting the server.')
  process.exit(1)
}
if (secret === 'change-me') {
  if (process.env.NODE_ENV === 'production') {
    console.error('JWT_SECRET is still the placeholder "change-me". Set a long random value.')
    process.exit(1)
  }
  console.warn('Warning: JWT_SECRET is the placeholder "change-me". Fine for local demos, never for production.')
}

startBookingLifecycleJob()

// API_PORT (not PORT): tools and hosts often set PORT for the front-end dev server,
// and the API must not accidentally pick it up.
const PORT = process.env.API_PORT || 4000

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/api/health`)
})

