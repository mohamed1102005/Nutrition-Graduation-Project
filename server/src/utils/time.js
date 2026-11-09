// time.js — "what day is it for the user?"
//
// Clients live in Egypt, so "today" must be the calendar day in Cairo, not in
// UTC. Between midnight and 2-3am Cairo time the UTC date is still yesterday,
// which used to put check-offs, streaks and the weekly count on the wrong day.
//
// All helpers work on plain 'YYYY-MM-DD' strings so no time zone can sneak in
// while we add days or look for the Monday of a week.

const TZ = 'Africa/Cairo'
const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })

/** Calendar date in Cairo for a moment in time (default: now). */
export function cairoDate(date = new Date()) {
  return fmt.format(date) // en-CA gives YYYY-MM-DD
}

export function cairoToday() {
  return cairoDate()
}

/** Add (or subtract) whole days to a 'YYYY-MM-DD' string. */
export function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Whole days from a to b ('YYYY-MM-DD'), b - a. */
export function daysBetween(a, b) {
  return Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 86400000)
}

/** Day of week of a 'YYYY-MM-DD' string: 1 = Monday ... 7 = Sunday. */
export function isoWeekday(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`).getUTCDay()
  return d === 0 ? 7 : d
}

export function mondayOf(dateStr) {
  return addDays(dateStr, 1 - isoWeekday(dateStr))
}

// Client-sent dates may not be in the future, and may not be absurdly old.
export const MAX_BACKDATE_DAYS = 30

/** Returns an error message if a client-chosen date is not allowed, else null. */
export function checkEntryDate(dateStr) {
  const today = cairoToday()
  if (dateStr > today) return 'You cannot log something for a future date.'
  if (daysBetween(dateStr, today) > MAX_BACKDATE_DAYS) {
    return `You can only log entries from the last ${MAX_BACKDATE_DAYS} days.`
  }
  return null
}
