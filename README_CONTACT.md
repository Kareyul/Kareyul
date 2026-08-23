Contact form backend
---------------------

This repository includes a lightweight Node/Express server to forward contact form submissions to an email address via Gmail and Nodemailer.

Setup

1. Copy `.env.example` to `.env` and fill in your Gmail credentials:

```env
EMAIL_USER=your@gmail.com
EMAIL_PASS=your-app-password
EMAIL_DEST=destination@gmail.com
PORT=3000
```

Important: For Gmail, create an App Password (recommended) in your Google account security settings if you have 2FA enabled. Do not use your main password.

2. Install dependencies and start the server (requires Node.js >= 14):

```bash
npm install
npm start
```

Deploy to Firebase Functions:

```bash
# Login to Firebase
npx firebase login

# Set email credentials on the Firebase project. Use GitHub secrets for CI.
npx firebase functions:config:set email.user="you@example.com" email.pass="your-app-password" email.dest="destination@example.com"

# Deploy functions and hosting
npm run deploy
```

3. Run the static site (if not already) and ensure the contact form posts to the same origin (or adjust `fetch` URL in `script.js`).

Notes
- The server uses the `EMAIL_USER` address as the SMTP sender and `EMAIL_DEST` as the recipient (defaults to `EMAIL_USER`).
- If you host the static site separately, proxy `/api/contact` to this server or update the fetch URL.
