// notify.js — tiny helper that drops a notification row for one user.
// Notifications are best effort: a failure here must never break the real action.

import db from '../db/connection.js'

export function notify(userId, type, title, body = null, link = null) {
  if (!userId) return
  try {
    db.prepare(
      'INSERT INTO notifications (user_id, type, title, body, link) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, type, title, body, link)
  } catch (err) {
    console.error('notify failed:', err.message)
  }
}
