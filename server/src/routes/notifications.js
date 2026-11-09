// notifications.js — the logged-in user's own notifications (any role).
//
// GET   /api/notifications           latest 30 + unread count
// PATCH /api/notifications/:id/read  mark one as read
// POST  /api/notifications/read-all  mark all as read

import { Router } from 'express'
import db from '../db/connection.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 30')
    .all(req.user.id)
  const unread = db
    .prepare('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read_at IS NULL')
    .get(req.user.id).n

  res.json({
    data: {
      unreadCount: unread,
      notifications: rows.map((r) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        body: r.body,
        link: r.link,
        read: r.read_at !== null,
        createdAt: r.created_at,
      })),
    },
  })
})

router.patch('/:id/read', (req, res) => {
  const result = db
    .prepare("UPDATE notifications SET read_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ? AND user_id = ?")
    .run(Number(req.params.id), req.user.id)
  if (result.changes === 0) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Notification not found.' } })
  }
  res.json({ data: { success: true } })
})

router.post('/read-all', (req, res) => {
  db.prepare(
    "UPDATE notifications SET read_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE user_id = ? AND read_at IS NULL"
  ).run(req.user.id)
  res.json({ data: { success: true } })
})

export default router
