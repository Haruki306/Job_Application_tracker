# Daymark — Job application tracker

A Next.js, React, and TypeScript job-search tracker with email/password accounts and MongoDB Atlas storage. Every application is owned by the account that created it; the API requires a valid sign-in session and scopes reads, updates, and deletes to that account.

## Local setup

The MongoDB Node.js driver and Better Auth MongoDB adapter are installed in this project. You do not need to install or run a MongoDB server locally; Atlas hosts the database.

1. Configure an Atlas database user and allow your current IP address in Atlas Network Access.
2. Set your private credentials in `.env.local`:

   ```env
   MONGODB_URI="your-private-atlas-connection-string"
   BETTER_AUTH_SECRET="a-unique-random-secret-of-at-least-32-characters"
   BETTER_AUTH_URL="http://localhost:3000"
   MONGODB_DB_NAME="daymark"
   ```

   The project already generated a local `BETTER_AUTH_SECRET` when auth was added. Keep `.env.local` private; it is ignored by Git. `.env.example` documents the required keys and is safe to commit.
3. Start the app:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000), create an account, and sign in.

## Included

- Private email/password sign-up and sign-in with server-managed sessions.
- Passwords are handled by Better Auth; the app stores account and session records in MongoDB.
- Application records include the signed-in user's ID. The server derives that ID from the session rather than accepting an owner ID from the browser.
- Add, edit, search, filter, and remove applications, contacts, notes, and next steps.
- Application API mutations require a same-origin request and an authenticated session.
- Passwords must be at least 12 characters. This local setup does not send email verification or password-reset emails.

Existing records from the earlier browser-only demo are not uploaded automatically. They remain in that browser's local storage, and the signed-in dashboard now reads only from MongoDB.

## Before public deployment

This is configured for local development; nothing has been deployed. Before exposing registration publicly, configure email verification and password reset with a real email provider, set a strong deployment-only `BETTER_AUTH_SECRET`, set `BETTER_AUTH_URL` to the exact HTTPS origin, and review Atlas Network Access and backup settings. Never expose `MONGODB_URI` to browser code or commit secrets.
