# Doctor Portal Backend

Backend API and database schema for Doctor Portal.

## Current Status

- Backend routes are modularized by feature (`auth`, `patients`, `records`, `referrals`, `audit`).
- MySQL + Drizzle schema integration is active through `server/db.ts` and `shared/schema.ts`.
- Passwords are hashed with `scrypt` before storage.
- Role-based auth is supported with `doctor` and `admin` users.
- Session-based authentication protects API routes and audit/admin access.

## Scope

- Express + TypeScript REST API (`server/`)
- Drizzle ORM schema and validation (`shared/schema.ts`)
- MySQL connection and database tooling (`server/db.ts`, `drizzle.config.ts`)

## Requirements

- Node.js 18+
- npm
- MySQL

## Environment

Create a `.env` file with:

```env
DATABASE_URL=mysql://<username>:<password>@<host>:3306/<database_name>
PORT=5001
SESSION_SECRET=<long-random-secret>
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM="Doctor Portal <no-reply@yourdomain.com>"
```

For Gmail SMTP, use:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=your-16-character-google-app-password
SMTP_FROM="Doctor Portal <yourgmail@gmail.com>"
```

Use a Google App Password, not your normal Gmail password.

## Run

```bash
npm install
npm run db:push
npm run dev
```

Default backend API URL:

- `http://localhost:5001`

## Build and start

```bash
npm run build
npm run start
```

In production, the backend can also serve the built frontend if `../frontend/dist/public` exists.

## Auth And Security

- Passwords are hashed with `scrypt`.
- Login attempts are rate-limited in memory to reduce brute-force attempts.
- Successful login creates a server-side session stored in MySQL.
- Protected routes require authentication.
- Audit log access requires an authenticated user with `role = admin`.
- Doctor profile updates are limited to email and phone.
- Password changes require the current password and re-hash the replacement password before saving.
- OTP verification codes are stored in MySQL with a 5-minute expiry.
- OTP emails are delivered through your configured SMTP provider.
- SMS OTP is not implemented yet.
