// test-phase8.js — Tier 3 hardening: Cairo dates, date bounds, AI draft rules,
// numeric ids, approved-only portal, login rate limit, reschedule guards.
//
// Run `npm run db:reset` first. This suite mutates the database.

import assert from 'node:assert'
import app from './src/app.js'
import db from './src/db/connection.js'
import { cairoDate, addDays, mondayOf, daysBetween, isoWeekday } from './src/utils/time.js'

const PORT = 4008
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
    // ── Time helpers ────────────────────────────────────────────────────
    console.log('--- Cairo time helpers ---')
    // 22:30 UTC on 31 Dec is already 1 January in Cairo (UTC+2 in winter).
    assert.strictEqual(cairoDate(new Date('2026-12-31T22:30:00Z')), '2027-01-01')
    assert.strictEqual(cairoDate(new Date('2026-12-31T20:30:00Z')), '2026-12-31')
    assert.strictEqual(addDays('2026-03-01', -1), '2026-02-28')
    assert.strictEqual(mondayOf('2026-11-08'), '2026-11-02') // Sunday -> Monday before
    assert.strictEqual(isoWeekday('2026-11-09'), 1)
    assert.strictEqual(daysBetween('2026-11-01', '2026-11-09'), 8)
    ok('Dates follow Cairo time and date maths has no time-zone drift')

    const sara = await login('sara@demo.com')
    const mona = await login('mona@demo.com')
    const karim = await login('karim@demo.com')

    // ── Date bounds ─────────────────────────────────────────────────────
    console.log('--- Entry date bounds ---')
    const itemId = db.prepare("SELECT pi.id FROM plan_items pi JOIN plans p ON p.id = pi.plan_id WHERE p.client_id = ? AND p.status = 'active' LIMIT 1").get(sara.user.id).id
    const tomorrow = addDays(cairoDate(), 1)
    const longAgo = addDays(cairoDate(), -90)

    let r = await call('PUT', '/completions', sara.token, { planItemId: itemId, date: tomorrow, status: 'done' })
    assert.strictEqual(r.status, 400)
    assert.strictEqual(r.json.error.code, 'INVALID_DATE')
    r = await call('PUT', '/completions', sara.token, { planItemId: itemId, date: longAgo, status: 'done' })
    assert.strictEqual(r.status, 400)
    r = await call('PUT', '/completions', sara.token, { planItemId: itemId, status: 'done' })
    assert.strictEqual(r.status, 200)
    ok('Completions reject future and very old dates; today works')

    r = await call('PUT', '/progress', sara.token, { date: tomorrow, painLevel: 2 })
    assert.strictEqual(r.status, 400)
    r = await call('PUT', '/progress', sara.token, { painLevel: 2 })
    assert.strictEqual(r.status, 200)
    ok('Progress rejects future dates; today works')

    // ── AI drafts ───────────────────────────────────────────────────────
    console.log('--- AI drafts ---')
    const lonely = await call('POST', '/auth/register', null, { name: 'Lonely Client', email: `lonely${Date.now()}@demo.com`, password: 'demo1234' })
    r = await call('POST', '/ai/plan', lonely.json.data.token, { goal: 'lose_fat', daysPerWeek: 3, injuries: [], equipment: 'home', diet: 'balanced' })
    assert.strictEqual(r.status, 200)
    r = await call('POST', `/ai/plan/${r.json.data.requestId}/send`, lonely.json.data.token)
    assert.strictEqual(r.status, 409)
    assert.strictEqual(r.json.error.code, 'NO_SPECIALIST')
    ok('A client without a specialist cannot send an AI draft (409 NO_SPECIALIST)')

    const gen = () => call('POST', '/ai/plan', sara.token, { goal: 'lose_fat', daysPerWeek: 3, injuries: [{ bodyArea: 'knee', painLevel: 3 }], equipment: 'gym', diet: 'balanced' })
    let g = await gen()
    r = await call('POST', `/ai/plan/${g.json.data.requestId}/send`, sara.token)
    assert.strictEqual(r.status, 200)
    g = await gen()
    r = await call('POST', `/ai/plan/${g.json.data.requestId}/send`, sara.token)
    assert.strictEqual(r.status, 200)
    const drafts = db.prepare("SELECT service, COUNT(*) AS n FROM plans WHERE client_id = ? AND source = 'ai' AND status = 'draft' GROUP BY service").all(sara.user.id)
    assert.ok(drafts.length === 3 && drafts.every((d) => d.n === 1), 'only one open AI draft per service')
    ok('Sending a second AI draft replaces the first instead of stacking')

    r = await call('GET', '/notifications', mona.token)
    assert.ok(r.json.data.notifications.some((n) => n.type === 'ai_draft_sent'))
    ok('The care team is notified when an AI draft is sent')

    // ── Numeric ids ─────────────────────────────────────────────────────
    console.log('--- Ids ---')
    r = await call('GET', '/specialist/clients/sara', mona.token)
    assert.strictEqual(r.status, 404)
    ok('Specialist portal no longer guesses clients from names')

    r = await call('POST', '/bookings', sara.token, { specialistId: 'mona', slotId: 1, sessionType: 'video' })
    assert.strictEqual(r.status, 400)
    ok('Booking requires a numeric specialist id')

    r = await call('GET', '/specialists/m%25/reviews')
    assert.ok(r.status === 404 || r.status === 200)
    r = await call('GET', '/specialists/%25/reviews')
    assert.strictEqual(r.status, 404)
    ok('Wildcards in public specialist lookups match nobody')

    // ── Approved-only portal ────────────────────────────────────────────
    console.log('--- Pending specialists ---')
    // Register a fresh specialist so the test does not depend on what earlier suites approved.
    const pendEmail = `pending${Date.now()}@demo.com`
    r = await call('POST', '/auth/register', null, { name: 'Pending Pat', email: pendEmail, password: 'demo1234', role: 'specialist', type: 'trainer', credentials: 'Certified trainer' })
    assert.strictEqual(r.status, 201)
    const pend = r.json.data
    r = await call('GET', '/specialist/clients', pend.token)
    assert.strictEqual(r.status, 403)
    assert.strictEqual(r.json.error.code, 'NOT_APPROVED')
    r = await call('GET', '/auth/me', pend.token)
    assert.strictEqual(r.status, 200)
    ok('Pending specialists can see their status but not the portal')

    // ── Reschedule guards ───────────────────────────────────────────────
    console.log('--- Reschedule ---')
    const karimId = karim.user.id
    const slots = db.prepare("SELECT id FROM availability_slots WHERE specialist_id = ? AND is_booked = 0 AND starts_at > strftime('%Y-%m-%dT%H:%M:%SZ','now','+2 days') ORDER BY starts_at LIMIT 2").all(karimId)
    r = await call('POST', '/bookings', sara.token, { specialistId: karimId, slotId: slots[0].id, sessionType: 'video' })
    assert.strictEqual(r.status, 201)
    const bookingId = r.json.data.booking.id
    db.prepare("UPDATE specialists SET approval_status = 'rejected' WHERE user_id = ?").run(karimId)
    r = await call('PATCH', `/bookings/${bookingId}/reschedule`, sara.token, { slotId: slots[1].id })
    assert.strictEqual(r.status, 400)
    assert.strictEqual(r.json.error.code, 'SPECIALIST_UNAVAILABLE')
    db.prepare("UPDATE specialists SET approval_status = 'approved' WHERE user_id = ?").run(karimId)
    ok('Cannot reschedule with a specialist who is no longer approved')

    // ── Login rate limit ────────────────────────────────────────────────
    console.log('--- Rate limit ---')
    const target = 'omar@demo.com'
    for (let i = 0; i < 10; i++) {
      r = await call('POST', '/auth/login', null, { email: target, password: 'wrong-password' })
      assert.strictEqual(r.status, 401)
    }
    r = await call('POST', '/auth/login', null, { email: target, password: 'wrong-password' })
    assert.strictEqual(r.status, 429)
    r = await call('POST', '/auth/login', null, { email: target, password: 'demo1234' })
    assert.strictEqual(r.status, 429)
    assert.ok(r.json.error.code === 'TOO_MANY_ATTEMPTS')
    r = await call('POST', '/auth/login', null, { email: 'sara@demo.com', password: 'demo1234' })
    assert.strictEqual(r.status, 200)
    ok('10 wrong passwords lock that account+IP for a while; other accounts are unaffected')

    console.log(`\nPhase 8 Tests Passed: ${passed}\n`)
  } finally {
    if (server) server.close()
  }
}

run().catch((err) => {
  console.error('\n❌ Phase 8 Test Failed:', err)
  if (server) server.close()
  process.exit(1)
})
