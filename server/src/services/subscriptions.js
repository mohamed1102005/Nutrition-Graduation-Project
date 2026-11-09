// subscriptions.js — one place that answers "does this client have access?".
// Org-sponsored members get an 'organization' subscription row, so the same
// check works for individuals and org members.

import db from '../db/connection.js'

export function getActiveSubscription(clientId) {
  return db
    .prepare(
      `SELECT * FROM subscriptions
       WHERE client_id = ? AND status = 'active'
       ORDER BY created_at DESC, id DESC
       LIMIT 1`
    )
    .get(clientId)
}

export function hasActiveSubscription(clientId) {
  return Boolean(getActiveSubscription(clientId))
}
