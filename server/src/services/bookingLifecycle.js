// bookingLifecycle.js — moves finished sessions to 'completed'.
//
// A specialist can mark a session complete by hand. As a safety net, any
// 'confirmed' booking whose slot ended more than 24 hours ago is completed
// automatically, so payouts never depend on someone remembering to click.

import db from '../db/connection.js'

export function autoCompletePastBookings() {
  const result = db
    .prepare(
      `UPDATE bookings SET status = 'completed'
       WHERE status = 'confirmed'
         AND slot_id IN (
           SELECT id FROM availability_slots
           WHERE ends_at < strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-24 hours')
         )`
    )
    .run()
  return result.changes
}

export function startBookingLifecycleJob() {
  autoCompletePastBookings()
  // Hourly sweep; unref() so the timer never keeps the process alive.
  setInterval(autoCompletePastBookings, 60 * 60 * 1000).unref()
}
