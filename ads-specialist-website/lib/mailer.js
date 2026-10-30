// lib/mailer.js
// Optional email notification whenever a new assessment request comes in.
// If SMTP_HOST isn't set, this quietly does nothing — leads are always saved
// to the database regardless.

const nodemailer = require('nodemailer');

function getTransport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

async function sendLeadNotification(lead) {
  const transport = getTransport();
  if (!transport || !process.env.NOTIFY_EMAIL) return;

  const lines = [
    `New assessment request from the Abatement and Demolition Specialist website`,
    ``,
    `Name: ${lead.name}`,
    `Phone: ${lead.phone}`,
    lead.email ? `Email: ${lead.email}` : null,
    lead.address ? `Property address: ${lead.address}` : null,
    lead.property_type ? `Property type: ${lead.property_type}` : null,
    lead.project_type ? `Project type: ${lead.project_type}` : null,
    lead.timeline ? `Timeline: ${lead.timeline}` : null,
    lead.message ? `Message:\n${lead.message}` : null,
  ].filter(Boolean);

  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.NOTIFY_EMAIL,
    subject: `New assessment request — ${lead.name}`,
    text: lines.join('\n'),
  });
}

module.exports = { sendLeadNotification };
