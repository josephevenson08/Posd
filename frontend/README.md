# Doctor Portal Frontend

Frontend web application for Doctor Portal.

## Current Status
- Frontend is separated from backend/database into its own repository.
- Standard login routes by role:
  - doctors continue through the doctor portal flow
  - admins are redirected to the audit/admin page
- The settings page now supports live updates for doctor email, phone number, and password.
- Frontend requests `/api/*` through Vite proxy to the backend service.

## Scope
- React + TypeScript single-page application
- Dashboard UI for auth, patients, records, referrals, audit, and settings
- API integration against backend `/api/*` endpoints
- Shared frontend types from `shared/schema.ts`

## Requirements
- Node.js 18+
- npm

## Run locally
```bash
npm install
npm run dev
```

Default dev URL:
- `http://localhost:5000`

This frontend expects the backend API to be running separately on `http://localhost:5001`.

## Build and preview
```bash
npm run build
npm run start
```

## Backend dependency
This repository is frontend-only.

Backend API and database now live in:
- `https://github.com/josephevenson08/DoctorPortal-Backend`

Set up your backend and run it separately, then ensure frontend requests to `/api/*` are routed to that backend in your environment.

## Auth And Admin Flow
- Users sign in through the normal login page.
- Doctor users continue through the doctor portal flow.
- Admin users are redirected to the audit/admin page after login.
- Admin access is enforced by backend role checks rather than a frontend-only passcode.

## Settings Features
- Update doctor email
- Update doctor phone number
- Update password with current-password verification
- Sign out through the backend logout route

## Branch Workflow
- `main`: stable, deployable frontend code
- `develop`: integration branch for upcoming sprint work
- `feature/<name>`: short-lived feature branches opened from `develop`, then merged back into `develop`

## Key folders
- `client/` frontend app source
- `shared/` shared TypeScript contracts consumed by frontend
- `attached_assets/` non-database project assets
