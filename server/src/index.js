// index.js — Entry point. Imports the configured app and starts listening.
// Run via: node --watch server/src/index.js   (or npm run dev from root)

import app from './app.js'
import { startBookingLifecycleJob } from './services/bookingLifecycle.js'

startBookingLifecycleJob()

// API_PORT (not PORT): tools and hosts often set PORT for the front-end dev server,
// and the API must not accidentally pick it up.
const PORT = process.env.API_PORT || 4000

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/api/health`)
})

