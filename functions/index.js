const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const cfg = functions.config().email || {}
  const user = cfg.user;
  const pass = cfg.pass;
  const dest = cfg.dest || user;

  if (!user || !pass) {
    return res.status(500).json({ message: 'Email credentials not configured on server' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });

    const mail = {
      from: user,
      to: dest,
      subject: `Portfolio contact form — ${name}`,
      replyTo: email,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g,'<br>')}</p><hr><p>Sent: ${new Date().toISOString()}</p>`
    };

    await transporter.sendMail(mail);
    return res.json({ message: 'Email sent' });
  } catch (err) {
    console.error('Mail error:', err);
    return res.status(500).json({ message: 'Failed to send email' });
  }
});

exports.contact = functions.https.onRequest(app);
