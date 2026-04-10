# Doctor Portal Backend

Backend API and database schema for Doctor Portal.

## Current Status
- Backend routes were modularized by feature (`auth`, `patients`, `records`, `referrals`, `audit`).
- MySQL + Drizzle schema integration is active through `server/db.ts` and `shared/schema.ts`.
- Backend and database were separated from the frontend into this dedicated repository.
- Passwords are hashed with `scrypt` before storage.
- Role-based auth is supported with `doctor` and `admin` users.
- Session-based authentication protects API routes and audit/admin access.

## Scope
- Express + TypeScript REST API (`server/`)
- Drizzle ORM schema and validation (`shared/schema.ts`)
- MySQL connection and database tooling (`server/db.ts`, `drizzle.config.ts`)
- SQL schema asset (`attached_assets/schema_1771444245774.sql`)

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
```

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

## Auth And Security
- Passwords are hashed with `scrypt`.
- Login attempts are rate-limited in memory to reduce brute-force attempts.
- Successful login creates a server-side session.
- Protected routes require authentication.
- Audit log access requires an authenticated user with `role = admin`.
- Doctor profile updates are limited to email and phone.
- Password changes require the current password and re-hash the replacement password before saving.

## Database Notes
- The `users` table now includes a `role` column.
- Standard app users should use `role = doctor`.
- Admin users should use `role = admin`.
- After schema updates, existing admin-capable users can be promoted with SQL such as:

```sql
UPDATE users
SET role = 'admin'
WHERE username = 'adminrole';
```

## Key folders
- `server/` API routes, modules, and runtime
- `shared/` Drizzle schema + zod contracts
- `attached_assets/` database diagram and SQL asset
- `script/build.ts` backend production bundle

## Branch Workflow
- `main`: stable backend/database code
- `develop`: integration branch for upcoming sprint work
- `feature/<name>`: short-lived feature branches opened from `develop`, then merged back into `develop`
