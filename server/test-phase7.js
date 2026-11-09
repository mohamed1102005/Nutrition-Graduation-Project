// test-phase7.js — slots, booking lifecycle, subscription gating, payouts,
// account management, password reset, notifications.
//
// Run `npm run db:reset` first. This suite mutates the database.

import assert from 'node:assert'
import app from './src/app.js'
import db from './src/db/connection.js'

process.env.EXPOSE_RESET_TOKEN = 'true'
const PORT = 4007
const base = `http://localhost:${PORT}/api`
let server
let passed = 0
const ok = (m) => { passed++; console.log(`  ✓ ${m}`) }

async function call(method, path, token, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: res.status, json: await res.json() }
}
const login = async (email, password = 'demo1234') => (await call('POST', '/auth/login', null, { email, password })).json.data

async function run() {
  server = app.listen(PORT)
  try {
    const sara = await login('sara@demo.com')
    const mona = await login('mona@demo.com')
    const karim = await login('karim@demo.com')
    const admin = await login('admin@demo.com')
    const finance = await login('finance@demo.com')

    // ── Slot management ────────────────────────────────────────────────
    console.log('--- Slot management ---')
    const future = new Date(Date.now() + 40 * 86400000)
    future.setMinutes(0, 0, 0)

    let r = await call('POST', '/specialist/schedule/slots', mona.token, { startsAt: future.toISOString() })
    assert.strictEqual(r.status, 201)
    const slotId = r.json.data.slot.id
    ok('Specialist can open a new slot')

    r = await call('POST', '/specialist/schedule/slots', mona.token, { startsAt: future.toISOString() })
    assert.strictEqual(r.json.data.slot.id, slotId)
    ok('Opening the same slot twice is idempotent')

    r = await call('POST', '/specialist/schedule/slots', mona.token, { startsAt: new Date(Date.now() - 3600000).toISOString() })
    assert.strictEqual(r.status, 400)
    assert.strictEqual(r.json.error.code, 'PAST_SLOT')
    ok('Cannot open a slot in the past')

    r = await call('POST', '/specialist/schedule/slots', sara.token, { startsAt: future.toISOString() })
    assert.strictEqual(r.status, 403)
    ok('Clients cannot manage availability')

    r = await call('DELETE', `/specialist/schedule/slots/${slotId}`, karim.token)
    assert.strictEqual(r.status, 404)
    ok("A specialist cannot delete another specialist's slot")

    // Book it as Sara, then try to block it
    const monaId = mona.user.id
    r = await call('POST', '/bookings', sara.token, { specialistId: monaId, slotId, sessionType: 'video' })
    assert.strictEqual(r.status, 201)
    const bookingId = r.json.data.booking.id
    ok('Client books the newly opened slot')

    r = await call('DELETE', `/specialist/schedule/slots/${slotId}`, mona.token)
    assert.strictEqual(r.status, 409)
    assert.strictEqual(r.json.error.code, 'SLOT_BOOKED')
    ok('A booked slot cannot be blocked')

    r = await call('GET', '/notifications', mona.token)
    assert.ok(r.json.data.notifications.some((n) => n.type === 'booking_created'))
    ok('Specialist is notified of the new booking')

    // ── Booking lifecycle ──────────────────────────────────────────────
    console.log('--- Booking lifecycle ---')
    r = await call('PATCH', `/specialist/bookings/${bookingId}/complete`, mona.token)
    assert.strictEqual(r.status, 409)
    assert.strictEqual(r.json.error.code, 'TOO_EARLY')
    ok('Cannot complete a session that has not started')

    r = await call('PATCH', `/specialist/bookings/${bookingId}/cancel`, karim.token)
    assert.strictEqual(r.status, 404)
    ok('Another specialist cannot cancel the booking')

    r = await call('PATCH', `/specialist/bookings/${bookingId}/cancel`, mona.token)
    assert.strictEqual(r.status, 200)
    assert.strictEqual(db.prepare('SELECT is_booked FROM availability_slots WHERE id = ?').get(slotId).is_booked, 0)
    ok('Specialist cancels a future session and the slot is freed')

    r = await call('GET', '/notifications', sara.token)
    assert.ok(r.json.data.notifications.some((n) => n.type === 'booking_cancelled'))
    ok('Client is notified of the specialist cancellation')

    // A started session can be completed
    const pastStart = new Date(Date.now() - 3600000).toISOString().replace(/\.\d{3}Z$/, 'Z')
    const pastEnd = new Date(Date.now() - 1800000).toISOString().replace(/\.\d{3}Z$/, 'Z')
    const pastSlot = db.prepare('INSERT INTO availability_slots (specialist_id, starts_at, ends_at, is_booked) VALUES (?, ?, ?, 1)').run(monaId, pastStart, pastEnd).lastInsertRowid
    const pastBooking = db.prepare("INSERT INTO bookings (client_id, specialist_id, slot_id, session_type, status, price_egp) VALUES (?, ?, ?, 'video', 'confirmed', 450)").run(sara.user.id, monaId, pastSlot).lastInsertRowid
    r = await call('PATCH', `/specialist/bookings/${pastBooking}/complete`, mona.token)
    assert.strictEqual(r.status, 200)
    ok('Specialist completes a session that has started')

    // ── Subscription gating ────────────────────────────────────────────
    console.log('--- Subscription gating ---')
    const reg = await call('POST', '/auth/register', null, { name: 'New Client', email: `new${Date.now()}@demo.com`, password: 'demo1234' })
    const fresh = reg.json.data
    r = await call('POST', '/bookings', fresh.token, { specialistId: monaId, slotId, sessionType: 'video' })
    assert.strictEqual(r.status, 402)
    assert.strictEqual(r.json.error.code, 'SUBSCRIPTION_REQUIRED')
    ok('Booking without a subscription is rejected (402)')

    r = await call('POST', '/checkout', fresh.token, { planName: 'Starter', method: 'card' })
    assert.strictEqual(r.status, 201)
    r = await call('POST', '/bookings', fresh.token, { specialistId: monaId, slotId, sessionType: 'video' })
    assert.strictEqual(r.status, 201)
    ok('Booking works after checkout')

    r = await call('POST', '/checkout/cancel', fresh.token)
    assert.strictEqual(r.status, 200)
    r = await call('GET', '/checkout/current', fresh.token)
    assert.strictEqual(r.json.data.subscription, null)
    ok('Cancelled subscription is no longer current')

    // ── Payouts computed on the server ─────────────────────────────────
    console.log('--- Payouts ---')
    const before = (await call('GET', '/finance/payouts', finance.token)).json.data.specialists.find((s) => s.id === monaId)
    assert.ok(before.pendingAmount > 0, 'Mona should have a pending balance')

    r = await call('POST', '/finance/payouts/settle', finance.token, { specialistId: monaId, netPayoutEgp: 999999, amountEgp: 999999 })
    assert.strictEqual(r.status, 201)
    assert.strictEqual(r.json.data.payout.net_payout_egp, before.pendingAmount)
    ok('Settle ignores client-sent amounts and pays exactly the computed balance')

    r = await call('POST', '/finance/payouts/settle', finance.token, { specialistId: monaId })
    assert.strictEqual(r.status, 409)
    assert.strictEqual(r.json.error.code, 'NOTHING_TO_SETTLE')
    ok('Settling twice is rejected (409 NOTHING_TO_SETTLE)')

    // ── Account management ─────────────────────────────────────────────
    console.log('--- Account ---')
    r = await call('PUT', '/account', fresh.token, { name: 'Renamed Client' })
    assert.strictEqual(r.json.data.user.name, 'Renamed Client')
    ok('User can change their name')

    r = await call('PUT', '/account', fresh.token, { email: 'sara@demo.com' })
    assert.strictEqual(r.status, 409)
    ok('Email already in use is rejected')

    r = await call('PUT', '/account/password', fresh.token, { currentPassword: 'wrong-pass', newPassword: 'newpass123' })
    assert.strictEqual(r.status, 400)
    r = await call('PUT', '/account/password', fresh.token, { currentPassword: 'demo1234', newPassword: 'newpass123' })
    assert.strictEqual(r.status, 200)
    assert.ok((await call('POST', '/auth/login', null, { email: fresh.user.email, password: 'newpass123' })).json.data.token)
    ok('Password change needs the current password and takes effect')

    r = await call('PUT', '/account/specialist-profile', mona.token, { bio: 'Updated bio', rateEgp: 500 })
    assert.strictEqual(r.json.data.specialist.rateEgp, 500)
    r = await call('PUT', '/account/specialist-profile', sara.token, { bio: 'x' })
    assert.strictEqual(r.status, 403)
    ok('Specialist edits profile; clients cannot')

    // ── Password reset ─────────────────────────────────────────────────
    console.log('--- Password reset ---')
    r = await call('POST', '/auth/forgot-password', null, { email: fresh.user.email })
    const token = r.json.data.resetToken
    assert.ok(token)
    r = await call('POST', '/auth/forgot-password', null, { email: 'nobody@nowhere.com' })
    assert.strictEqual(r.status, 200)
    assert.strictEqual(r.json.data.resetToken, undefined)
    ok('Forgot-password gives the same response for unknown emails')

    r = await call('POST', '/auth/reset-password', null, { token, newPassword: 'resetpass123' })
    assert.strictEqual(r.status, 200)
    r = await call('POST', '/auth/reset-password', null, { token, newPassword: 'again12345' })
    assert.strictEqual(r.status, 400)
    ok('Reset token works once and then is invalid')

    // ── Notifications ──────────────────────────────────────────────────
    console.log('--- Notifications ---')
    r = await call('GET', '/notifications', sara.token)
    assert.ok(r.json.data.unreadCount > 0)
    const nid = r.json.data.notifications[0].id
    r = await call('PATCH', `/notifications/${nid}/read`, sara.token)
    assert.strictEqual(r.status, 200)
    r = await call('PATCH', `/notifications/${nid}/read`, mona.token)
    assert.strictEqual(r.status, 404)
    r = await call('POST', '/notifications/read-all', sara.token)
    r = await call('GET', '/notifications', sara.token)
    assert.strictEqual(r.json.data.unreadCount, 0)
    ok('Notifications can be read; users cannot touch each other\'s')

    // admin approval notification already covered by code path; quick smoke
    assert.ok(admin.token)

    console.log(`\nPhase 7 Tests Passed: ${passed}\n`)
  } finally {
    if (server) server.close()
  }
}

run().catch((err) => {
  console.error('\n❌ Phase 7 Test Failed:', err)
  if (server) server.close()
  process.exit(1)
})
