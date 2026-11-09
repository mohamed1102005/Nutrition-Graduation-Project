// checkout.js — Mock checkout and subscription route.
//
// In this demo, no real payment processor (e.g. Stripe or Paymob) is used.
// Clients select a plan name ('Starter', 'Plus', 'Full Team') and a payment method.
// The price is securely determined on the server — never trusted from the client.
// An active subscription record is created with a reference code (e.g. DEMO-XXXXXX).

import { Router } from 'express'
import { z } from 'zod'
import db from '../db/connection.js'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'
import { validate } from '../middleware/validate.js'
import { getActiveSubscription } from '../services/subscriptions.js'

const router = Router()

// Server-side pricing table. The client cannot dictate these values.
const PLAN_PRICES = {
  'Starter': 399,
  'Plus': 899,
  'Full Team': 1499,
}

const checkoutSchema = z.object({
  planName: z.enum(['Starter', 'Plus', 'Full Team'], {
    errorMap: () => ({ message: "planName must be 'Starter', 'Plus', or 'Full Team'" }),
  }),
  method: z.enum(['card', 'fawry', 'vodafone_cash', 'instapay'], {
    errorMap: () => ({ message: "method must be 'card', 'fawry', 'vodafone_cash', or 'instapay'" }),
  }),
})

/**
 * POST /api/checkout
 * Records a mock subscription for the authenticated client.
 */
router.post('/', requireAuth, requireRole('client'), validate(checkoutSchema), (req, res) => {
  const clientId = req.user.id
  const { planName, method } = req.body

  // Check if member is part of an organization
  const user = db.prepare('SELECT organization_id FROM users WHERE id = ?').get(clientId)
  if (user && user.organization_id !== null) {
    return res.status(409).json({
      error: {
        code: 'ALREADY_SPONSORED',
        message: 'Your membership is sponsored by your organization. No checkout required.',
      },
    })
  }

  // One active subscription at a time. Cancel first to switch plans.
  if (getActiveSubscription(clientId)) {
    return res.status(409).json({
      error: {
        code: 'ALREADY_SUBSCRIBED',
        message: 'You already have an active subscription. Cancel it first to choose a different plan.',
      },
    })
  }

  const priceEgp = PLAN_PRICES[planName]

  // Generate a realistic demo reference code, e.g. DEMO-8F2K41
  const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase()
  const reference = `DEMO-${randomChars}`

  const info = db
    .prepare(
      `INSERT INTO subscriptions (client_id, plan_name, price_egp, method, status, source, reference)
       VALUES (?, ?, ?, ?, 'active', 'self', ?)`
    )
    .run(clientId, planName, priceEgp, method, reference)

  const subscription = db
    .prepare(`SELECT * FROM subscriptions WHERE id = ?`)
    .get(info.lastInsertRowid)

  res.status(201).json({
    data: {
      subscription: {
        id: subscription.id,
        clientId: subscription.client_id,
        planName: subscription.plan_name,
        priceEgp: subscription.price_egp,
        method: subscription.method,
        status: subscription.status,
        source: subscription.source || 'self',
        organizationName: null,
        reference: subscription.reference,
        createdAt: subscription.created_at,
      },
    },
  })
})

/**
 * GET /api/checkout/current
 * Returns the authenticated client's latest active subscription if any.
 */
router.get('/current', requireAuth, requireRole('client'), (req, res) => {
  const clientId = req.user.id

  const subscription = db
    .prepare(
      `SELECT * FROM subscriptions
       WHERE client_id = ? AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 1`
    )
    .get(clientId)

  if (!subscription) {
    return res.json({ data: { subscription: null } })
  }

  const user = db.prepare('SELECT organization_id FROM users WHERE id = ?').get(clientId)
  let orgName = null
  if (user?.organization_id) {
    const org = db.prepare('SELECT name FROM organizations WHERE id = ?').get(user.organization_id)
    orgName = org?.name || null
  }

  res.json({
    data: {
      subscription: {
        id: subscription.id,
        clientId: subscription.client_id,
        planName: subscription.plan_name,
        priceEgp: subscription.price_egp,
        method: subscription.method,
        status: subscription.status,
        source: subscription.source || 'self',
        organizationName: subscription.source === 'organization' ? orgName : null,
        reference: subscription.reference,
        createdAt: subscription.created_at,
      },
    },
  })
})

/**
 * POST /api/checkout/cancel
 * Cancels the client's own paid subscription. Sponsored memberships can only
 * be ended by the organization. Future bookings stay valid; new ones are blocked.
 */
router.post('/cancel', requireAuth, requireRole('client'), (req, res) => {
  const subscription = getActiveSubscription(req.user.id)
  if (!subscription) {
    return res.status(404).json({
      error: { code: 'NO_ACTIVE_SUBSCRIPTION', message: 'You have no active subscription.' },
    })
  }
  if (subscription.source === 'organization') {
    return res.status(409).json({
      error: {
        code: 'SPONSORED_SUBSCRIPTION',
        message: 'This membership is sponsored by your organization and cannot be cancelled here.',
      },
    })
  }

  db.prepare("UPDATE subscriptions SET status = 'cancelled' WHERE id = ?").run(subscription.id)
  res.json({ data: { success: true, subscriptionId: subscription.id, status: 'cancelled' } })
})

export default router

