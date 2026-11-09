// account.js — the logged-in user manages their own account (any role).
//
// GET /api/account                      user + specialist profile (if any)
// PUT /api/account                      change name / email
// PUT /api/account/password             change password (needs the current one)
// PUT /api/account/specialist-profile   specialist edits bio, rate, city ...

import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import db from '../db/connection.js'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'
import { validate } from '../middleware/validate.js'

const router = Router()
router.use(requireAuth)

function loadSpecialist(userId) {
  const s = db.prepare('SELECT * FROM specialists WHERE user_id = ?').get(userId)
  if (!s) return null
  return {
    type: s.type,
    credentials: s.credentials,
    bio: s.bio,
    city: s.city,
    yearsExperience: s.years_experience,
    languages: s.languages,
    focusTags: s.focus_tags ? s.focus_tags.split(',') : [],
    rateEgp: s.rate_egp,
    approvalStatus: s.approval_status,
  }
}

router.get('/', (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.user.id)
  res.json({
    data: {
      user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.created_at },
      specialist: loadSpecialist(user.id),
    },
  })
})

const updateAccountSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required.').max(80).optional(),
    email: z.string().trim().email('Valid email address required.').optional(),
  })
  .refine((v) => v.name !== undefined || v.email !== undefined, 'Nothing to update.')

router.put('/', validate(updateAccountSchema), (req, res) => {
  const { name, email } = req.body

  if (email) {
    const taken = db
      .prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE AND id != ?')
      .get(email, req.user.id)
    if (taken) {
      return res.status(409).json({
        error: { code: 'EMAIL_IN_USE', message: 'An account with this email already exists.', fields: { email: 'Already in use' } },
      })
    }
  }

  db.prepare('UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?').run(
    name ?? null,
    email ?? null,
    req.user.id
  )

  const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.user.id)
  res.json({ data: { user } })
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long.'),
})

router.put('/password', validate(passwordSchema), (req, res) => {
  const { currentPassword, newPassword } = req.body
  const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id)

  if (!bcrypt.compareSync(currentPassword, row.password_hash)) {
    return res.status(400).json({
      error: { code: 'WRONG_PASSWORD', message: 'Your current password is incorrect.', fields: { currentPassword: 'Incorrect password' } },
    })
  }

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), req.user.id)
  res.json({ data: { success: true } })
})

const specialistProfileSchema = z
  .object({
    bio: z.string().trim().max(1000).optional(),
    city: z.string().trim().max(60).optional(),
    rateEgp: z.number().int().min(0).max(100000).optional(),
    yearsExperience: z.number().int().min(0).max(70).optional(),
    languages: z.string().trim().max(120).optional(),
    focusTags: z.array(z.string().trim().min(1)).max(10).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update.')

router.put('/specialist-profile', requireRole('specialist'), validate(specialistProfileSchema), (req, res) => {
  const { bio, city, rateEgp, yearsExperience, languages, focusTags } = req.body

  db.prepare(
    `UPDATE specialists SET
       bio = COALESCE(?, bio),
       city = COALESCE(?, city),
       rate_egp = COALESCE(?, rate_egp),
       years_experience = COALESCE(?, years_experience),
       languages = COALESCE(?, languages),
       focus_tags = COALESCE(?, focus_tags)
     WHERE user_id = ?`
  ).run(
    bio ?? null,
    city ?? null,
    rateEgp ?? null,
    yearsExperience ?? null,
    languages ?? null,
    focusTags ? focusTags.join(',') : null,
    req.user.id
  )

  res.json({ data: { specialist: loadSpecialist(req.user.id) } })
})

export default router
