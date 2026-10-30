# Abatement and Demolition Specialist LLC — Website

A website + lead-capture backend for Abatement and Demolition Specialist
LLC, a Maine-based, family-owned asbestos/lead/mold abatement and general
demolition contractor based in Augusta, ME, run by Russell &amp; Jocelyn
Harvey, serving Maine and New Hampshire.

## What's included

- **Public site** (`public/`) — homepage with hero, 4 core services
  (Asbestos Abatement, Mold Remediation, RRP Lead Removal, General
  Demolition), a "Why Us" section, a 6-photo Recent Work gallery, service
  area, and a "Request a Free Assessment" form.
- **Backend API** (`server.js`, `routes/`, `db/`) — Node.js + Express +
  SQLite. Every assessment request is saved as a **lead** in a real
  database, not just emailed and forgotten.
- **Admin dashboard** (`/admin`) — **password-only** login (no username),
  to view, filter by status, update, delete, and export every lead that
  comes in, plus a CSV export button.
- Optional **email notifications** whenever a new lead comes in (off by
  default until you add SMTP details).
- Basic spam protection: a honeypot field + rate limiting on the form.
- **Logo & photos**: `public/images/logo.png` and `logo-white.png` are the
  client's real logo, pulled directly from their current live site
  (abatementanddemolition.com). All 7 job photos used across the site
  (`job-exterior.jpg`, `job-strip-out.jpg`, `job-interior.jpg`,
  `job-crawlspace-1.jpg`, `job-crawlspace-2.jpg`,
  `job-pipe-containment.jpg`, `job-bathroom-demo.jpg`) are real client
  job-site photos — not stock, not AI-generated.

## Branding notes

- This build matches the client's **actual current branding** — full name
  "Abatement and Demolition Specialist LLC," their real logo, and a
  red/black/white palette sampled directly from that logo (red ≈
  `#bf1216`). This intentionally replaces an earlier, different-palette
  build from months back that the client never launched.
- Per house style, the generic numbered "1-2-3-4 process" section every
  templated contractor site has was deliberately left out. The same
  information (free assessment → permits handled → safe removal → clean
  haul-away) is folded into a short "What to expect" callout in the Why Us
  section instead.
- Footer carries the standard "Website by Real Easy Sites" credit link.

## Before this goes live

1. **Social media** — no active Facebook/Instagram page was found for this
   business. If the client has one now, send it over and it can be added
   to the header/footer per the usual pattern.
2. **Admin password** — set a real `ADMIN_PASSWORD` before deploying (see
   below). There is no default password; the login is disabled until one
   is set.

All client photos received so far (7 total) are already in the site. Any
more that come in later just drop into `public/images/` and get added as
a 7th+ tile in the Recent Work grid (`public/index.html`, `#work` section).

`NOTIFY_EMAIL` is already confirmed: abatementanddemo@gmail.com, set in
`.env.example` — just copy it to `.env` as-is.

## Quick start (local)

Requires [Node.js](https://nodejs.org) 20.x (see `.node-version`).

```bash
npm install
cp .env.example .env
```

Open `.env` and set:
- `ADMIN_PASSWORD` — the password for `/admin` (password only, no
  username field).
- (Optional) `SESSION_SECRET` — a random string to sign the admin session
  cookie. If left blank, one is generated at boot, but admin sessions
  won't survive a server restart.
- (Optional) SMTP settings if you want an email every time someone submits
  the assessment form. Leave blank to skip — leads are always saved
  either way.
- `NOTIFY_EMAIL` — already set to abatementanddemo@gmail.com in
  `.env.example`.

Then run it:

```bash
npm start
```

- Website: http://localhost:3000
- Admin dashboard: http://localhost:3000/admin

The database is a single file at `db/ads.db`, created automatically the
first time the server runs. Back this file up occasionally (or export
leads to CSV from the admin dashboard).

## Editing the content

- **Text, phone number, services, service-area copy**: edit
  `public/index.html` directly — it's plain HTML, all content is inline
  and easy to find.
- **Colors, fonts, spacing**: `public/css/style.css`. Color variables are
  defined once at the top under `:root`.
- **Logo**: `public/images/logo.png` (color, light backgrounds) and
  `logo-white.png` (white, for the dark footer/admin header). Replace
  either file (same name) to swap in an updated version.
- **Photos**: `public/images/job-exterior.jpg` (hero background + Recent
  Work feature) and `job-interior.jpg` (Why Us section). Replace any file
  in place, or add new ones and reference them in `index.html`.

## Deploying it live

⚠️ This project pins Node to version 20 (via `.node-version` and
`package.json`'s `engines` field) on purpose — `better-sqlite3` (the
database) ships pre-built binaries for stable/LTS Node versions, but not
for very new ones. If a host ignores the pin and builds on a newer Node
anyway, `npm install` will fail trying to compile `better-sqlite3` from
source. On Render, you can force it by also setting an environment
variable `NODE_VERSION` to `20.18.1` in the dashboard.

**Render.com** (recommended if you want simplicity)
1. Push this folder to a GitHub repo.
2. Create a new "Web Service" on Render, connect the repo.
3. Build command: `npm install` — Start command: `npm start`.
4. Add the environment variables from `.env` in Render's dashboard
   (`ADMIN_PASSWORD` at minimum).
5. Render gives you a free `.onrender.com` URL immediately; connect a
   custom domain under Settings → Custom Domain once the client has one
   pointed here.

⚠️ Important: `db/ads.db` lives on disk. Most hosts' free tiers reset the
disk on redeploy. Once this is live and depending on leads, either (a) use
a host with a persistent disk/volume, or (b) upgrade to a hosted database
(e.g. Postgres) — a small change from SQLite.

## Security notes

- Set a real `ADMIN_PASSWORD` before going live — there is no default.
- Always deploy behind HTTPS (Render does this automatically) so the admin
  login and customer data aren't sent in plain text.
- `.env` and `db/ads.db` are already excluded via `.gitignore` — never
  commit either one.

## Project structure

```
ads-specialist-website/
├── server.js              # Express app entry point
├── package.json
├── .env.example            # copy to .env and fill in
├── db/
│   └── database.js         # SQLite schema + connection
├── lib/
│   ├── adminAuth.js         # password-only session auth for /admin
│   └── mailer.js            # optional email-on-new-lead
├── routes/
│   ├── assessment.js        # POST /api/assessment (public)
│   └── admin.js              # /admin/api/* (protected)
└── public/
    ├── index.html
    ├── css/style.css
    ├── js/main.js
    ├── admin/
    │   ├── login.html
    │   └── index.html
    └── 404.html
```
