Firebase deploy notes
=====================

This project is a static portfolio site with a small Express contact-server.

Quick deploy steps (recommended):

1. Install Firebase CLI locally (optional):

   npm install --save-dev firebase-tools

2. Log into Firebase (interactive):

   npx firebase login

3. Replace the placeholder project id in `.firebaserc` with your project's id:

   {
     "projects": {
       "default": "your-firebase-project-id"
     }
   }

4. When ready, build the site (if any build step) and run deploy:

   npm run deploy

CI / GitHub Actions deploy (recommended):

1. Create a Firebase CI token locally by running `npx firebase login:ci` and copying the token (you will need to be logged in with your Firebase account).
2. In your GitHub repository settings, add a new repository secret with the name `FIREBASE_TOKEN` and paste the token value.
3. This repository includes a GitHub Actions workflow `/.github/workflows/firebase-hosting-deploy.yml` that will automatically deploy the site when you push to `main` or `master`.

Notes for maintainers:
- If you'd rather use a service account instead of a CI token, use `FirebaseExtended/action-hosting-deploy@v0` and set a `FIREBASE_SERVICE_ACCOUNT` secret instead. The current workflow uses the CI token approach for simplicity.
- Ensure `.firebaserc` is set to the Firebase project you want to deploy to.
 - To allow the contact API to send mail from the deployed function, add the following GitHub secrets to your repo:
    - `EMAIL_USER`: the Gmail address used as the SMTP sender.
    - `EMAIL_PASS`: the app password / SMTP key (prefer app password or secret manager).
    - `EMAIL_DEST` (optional): destination email address.
    The Actions workflow (on push) will set Firebase functions runtime config from these secrets before deploying.

Notes:
- This repository contains a simple express `server.js` used for contact forwarding; Firebase Hosting is static-only. If you want to deploy the express API as well, consider using Cloud Functions, Cloud Run, or App Engine.
- The `firebase.json` is configured to host the site from the repository root. It ignores `server.js`, `node_modules`, and server related files so they will not be deployed by default.
 - The repository now includes a `functions/` Cloud Functions entry that hosts the contact API. The `firebase.json` rewrites `/api/**` to the `contact` function so contact form calls are proxied to the function.
 - Configure email credentials for the contact API with Firebase Functions runtime config values:

    ```bash
    firebase functions:config:set email.user="you@example.com" email.pass="your-app-password" email.dest="destination@example.com"
    ```

    When deploying from CI, set the same values in the project using the Firebase CLI or via environment-specific tooling. You can also keep credentials in GitHub Secrets and set them with the `firebase` CLI as a step in GitHub Actions if you prefer (the action must have permission to run `functions:config:set`).
