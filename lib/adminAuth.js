// lib/adminAuth.js
// Password-only admin session auth (no username field). Issues a signed,
// httpOnly session cookie on successful login; middleware below protects
// every /admin and /admin/api route.

const crypto = require('crypto');
const cookieSignature = require('cookie-signature');

const COOKIE_NAME = 'ads_admin_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function getSecret() {
  return process.env.SESSION_SECRET || getSecret.cached || (getSecret.cached = crypto.randomBytes(32).toString('hex'));
}

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    // Still run a compare of equal length to avoid an obvious early-return timing gap.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};
  return header.split(';').reduce((acc, part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return acc;
    const key = part.slice(0, idx).trim();
    const value = decodeURIComponent(part.slice(idx + 1).trim());
    acc[key] = value;
    return acc;
  }, {});
}

function issueSession(res) {
  const payload = JSON.stringify({ exp: Date.now() + SESSION_TTL_MS });
  const signed = cookieSignature.sign(Buffer.from(payload).toString('base64'), getSecret());
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(signed)}; HttpOnly; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}; SameSite=Lax`
  );
}

function clearSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
}

function isAuthenticated(req) {
  const cookies = parseCookies(req);
  const raw = cookies[COOKIE_NAME];
  if (!raw) return false;
  const unsigned = cookieSignature.unsign(raw, getSecret());
  if (!unsigned) return false;
  try {
    const payload = JSON.parse(Buffer.from(unsigned, 'base64').toString('utf8'));
    return typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

function requireAdmin(req, res, next) {
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(503).send('Admin login is disabled until ADMIN_PASSWORD is set on the server.');
  }
  if (isAuthenticated(req)) return next();
  if (req.path === '/login' || req.path === '/api/login') return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ ok: false, error: 'Not authenticated.' });
  return res.redirect('/admin/login');
}

module.exports = { requireAdmin, issueSession, clearSession, isAuthenticated, timingSafeEqual };
