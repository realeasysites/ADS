// routes/quotes.js
// Public-facing API for the quote-request form on the website.

const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db/database');
const { sendLeadNotification } = require('../lib/mailer');

const router = express.Router();

// Limit form submissions to reduce spam / abuse: 8 requests per 15 min per IP.
const quoteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests. Please try again shortly, or just call us.' },
});

const PROJECT_TYPES = new Set([
  'asbestos-abatement',
  'microbial-remediation',
  'lead-abatement',
  'demolition',
  'other',
]);

const PROPERTY_TYPES = new Set(['residential', 'commercial', 'municipal', 'not-sure']);

function isBlank(value) {
  return typeof value !== 'string' || value.trim().length === 0;
}

// Very small honeypot + basic field validation. No external validation
// library needed for a form this size.
router.post('/quote', quoteLimiter, (req, res) => {
  const body = req.body || {};

  // Honeypot field: real users never fill this in (it's hidden via CSS).
  if (!isBlank(body.company_website)) {
    // Silently pretend success so bots don't learn the honeypot worked.
    return res.json({ ok: true });
  }

  const name = (body.name || '').trim();
  const phone = (body.phone || '').trim();
  const email = (body.email || '').trim();
  const address = (body.address || '').trim();
  const propertyType = (body.property_type || '').trim();
  const projectType = (body.project_type || '').trim();
  const timeline = (body.timeline || '').trim();
  const message = (body.message || '').trim();

  const errors = [];
  if (isBlank(name) || name.length > 120) errors.push('Please enter your name.');
  if (isBlank(phone) || phone.replace(/\D/g, '').length < 7) {
    errors.push('Please enter a valid phone number.');
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('That email address doesn\'t look right.');
  }
  if (projectType && !PROJECT_TYPES.has(projectType)) errors.push('Unrecognized project type selected.');
  if (propertyType && !PROPERTY_TYPES.has(propertyType)) errors.push('Unrecognized property type selected.');
  if (message.length > 2000) errors.push('Message is too long.');

  if (errors.length > 0) {
    return res.status(400).json({ ok: false, error: errors[0], errors });
  }

  const stmt = db.prepare(`
    INSERT INTO leads (name, phone, email, address, property_type, project_type, timeline, message, ip_address)
    VALUES (@name, @phone, @email, @address, @property_type, @project_type, @timeline, @message, @ip_address)
  `);

  const result = stmt.run({
    name,
    phone,
    email: email || null,
    address: address || null,
    property_type: propertyType || null,
    project_type: projectType || null,
    timeline: timeline || null,
    message: message || null,
    ip_address: req.ip || null,
  });

  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);

  // Fire-and-forget: never let a slow/broken mail server block the response
  // to the person on the site.
  sendLeadNotification(lead).catch((err) => {
    console.error('Failed to send lead notification email:', err.message);
  });

  return res.status(201).json({ ok: true, message: 'Thanks — we\'ll be in touch shortly to schedule a look at the property.' });
});

module.exports = router;
