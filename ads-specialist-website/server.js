// server.js
// Abatement and Demolition Specialist LLC — website + backend.
// Thin entry point: real logic lives in routes/ and lib/.

require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');

const assessmentRoutes = require('./routes/assessment');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  helmet({
    contentSecurityPolicy: false, // keep simple for a static-content marketing site
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Admin routes are mounted BEFORE the public static files, so /admin always
// asks for the password first and signed-out API calls get a clean 401.
app.use('/admin', adminRoutes);

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', assessmentRoutes);

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' });
});

app.listen(PORT, () => {
  console.log(`Abatement and Demolition Specialist site running on http://localhost:${PORT}`);
});
