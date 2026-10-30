// routes/admin.js
// Password-only admin: login/logout + lead management API, all behind
// lib/adminAuth's requireAdmin middleware (mounted in server.js).

const express = require('express');
const path = require('path');
const db = require('../db/database');
const { requireAdmin, issueSession, clearSession, timingSafeEqual } = require('../lib/adminAuth');

const router = express.Router();

const VALID_STATUSES = new Set(['new', 'contacted', 'scheduled', 'closed']);

// --- Login page (unprotected) ---
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'login.html'));
});

router.post('/api/login', express.json(), (req, res) => {
  const password = (req.body && req.body.password) || '';
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(503).json({ ok: false, error: 'Admin login is disabled until ADMIN_PASSWORD is set.' });
  }
  if (!password || !timingSafeEqual(password, process.env.ADMIN_PASSWORD)) {
    return res.status(401).json({ ok: false, error: 'Incorrect password.' });
  }
  issueSession(res);
  return res.json({ ok: true });
});

// --- Everything below requires a valid admin session ---
router.use(requireAdmin);

router.post('/api/logout', (req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'index.html'));
});

router.get('/api/leads', (req, res) => {
  const leads = db.prepare('SELECT * FROM leads ORDER BY datetime(created_at) DESC').all();
  res.json({ ok: true, leads });
});

router.get('/api/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) AS n FROM leads').get().n;
  const byStatus = db.prepare('SELECT status, COUNT(*) AS n FROM leads GROUP BY status').all();
  const last7Days = db
    .prepare("SELECT COUNT(*) AS n FROM leads WHERE datetime(created_at) >= datetime('now', '-7 days')")
    .get().n;
  res.json({ ok: true, total, byStatus, last7Days });
});

router.patch('/api/leads/:id', express.json(), (req, res) => {
  const id = Number(req.params.id);
  const status = (req.body && req.body.status) || '';
  if (!VALID_STATUSES.has(status)) {
    return res.status(400).json({ ok: false, error: 'Invalid status.' });
  }
  const result = db.prepare('UPDATE leads SET status = ? WHERE id = ?').run(status, id);
  if (result.changes === 0) return res.status(404).json({ ok: false, error: 'Lead not found.' });
  res.json({ ok: true });
});

// Every submission must be deletable, so the owner can clear spam/test entries.
router.delete('/api/leads/:id', (req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare('DELETE FROM leads WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json({ ok: false, error: 'Lead not found.' });
  res.json({ ok: true });
});

router.get('/api/leads.csv', (req, res) => {
  const leads = db.prepare('SELECT * FROM leads ORDER BY datetime(created_at) DESC').all();
  const headers = [
    'id', 'created_at', 'name', 'phone', 'email', 'address',
    'property_type', 'project_type', 'timeline', 'message', 'status',
  ];
  const escape = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
  const rows = [headers.join(',')].concat(
    leads.map((lead) => headers.map((h) => escape(lead[h])).join(','))
  );
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="ads-leads.csv"');
  res.send(rows.join('\n'));
});

module.exports = router;
