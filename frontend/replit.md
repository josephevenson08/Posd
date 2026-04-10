# MediPortal - Patient Management System

## Overview

MediPortal is a full-stack web application for doctor-patient management. It provides a secure portal where healthcare professionals can manage patients, medical records, and referrals. The application features authentication (login, signup, MFA, password reset), a dashboard with sidebar navigation, and CRUD operations for core medical entities (doctors, patients, medical records, referrals).

The stack is a monorepo with a React frontend (Vite) and an Express backend, using PostgreSQL via Drizzle ORM for data persistence. The UI is built with shadcn/ui components and Tailwind CSS with a clean medical theme (soft blues, whites, slate grays).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (`client/`)
- **Framework**: React 18 with TypeScript
- **Bundler**: Vite (dev server on port 5000, HMR via custom middleware)
- **Routing**: Wouter (lightweight client-side router) — NOT react-router
- **State/Data Fetching**: TanStack React Query for server state management
- **UI Components**: shadcn/ui (new-york style) with Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS variables for theming, custom medical color scheme
- **Fonts**: Plus Jakarta Sans and Inter (Google Fonts)
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

**Key pages:**
- `/` and `/login` — Login page
- `/signup` — Registration
- `/mfa` — Multi-factor authentication (phone/OTP flow, currently simulated)
- `/forgot-password` — Password reset (currently simulated)
- `/dashboard` — Main dashboard
- `/dashboard/patients` — Patient management
- `/dashboard/records` — Medical records
- `/dashboard/referrals` — Referrals management

**Dashboard layout**: Sidebar navigation with dark slate theme, responsive with mobile sheet menu.

### Backend (`server/`)
- **Framework**: Express 5 on Node.js
- **Language**: TypeScript, run via `tsx` in development
- **API Pattern**: RESTful JSON API under `/api/` prefix
- **Build**: esbuild bundles server to `dist/index.cjs` for production; Vite builds client to `dist/public/`
- **Dev mode**: Vite dev server is integrated as Express middleware (see `server/vite.ts`)
- **Production mode**: Express serves static built files from `dist/public/`

**API Routes** (`/api/`):
- `POST /api/auth/register` — User registration
- `POST /api/auth/login` — User login (plain password comparison — no hashing yet)
- CRUD endpoints for `/api/doctors`, `/api/patients`, `/api/medical-records`, `/api/referrals`

**Authentication**: Basic username/password check via POST /api/auth/login and POST /api/auth/register. Passwords stored in plaintext (no hashing yet). No session/JWT middleware guards in place yet. Frontend uses apiRequest helper for all API calls.

### Shared (`shared/`)
- **Schema definitions**: Drizzle ORM table definitions + Zod validation schemas via `drizzle-zod`
- Used by both frontend (for types) and backend (for DB operations and validation)

**Database Tables:**
- `users` — Authentication (username, password, name, email, phone, specialty, licenseNumber)
- `doctors` — Doctor profiles (name, email, phone, specialty, licenseNumber, hireDate)
- `patients` — Patient records (name, dob, gender, contact info, emergency contact)
- `medicalRecords` — Medical records linked to patients
- `referrals` — Referral records

### Data Storage
- **Database**: PostgreSQL (required, connected via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `node-postgres` driver
- **Migrations**: Drizzle Kit with `drizzle-kit push` for schema sync (migrations output to `./migrations/`)
- **Storage layer**: `DatabaseStorage` class in `server/storage.ts` implements `IStorage` interface, providing a clean abstraction over database operations

### Build & Development
- `npm run dev` — Starts the full dev server (Express + Vite HMR)
- `npm run build` — Builds both client (Vite) and server (esbuild) to `dist/`
- `npm run start` — Runs production build
- `npm run db:push` — Pushes schema changes to database
- `npm run check` — TypeScript type checking

## External Dependencies

### Database
- **PostgreSQL** — Primary data store, connected via `DATABASE_URL` environment variable
- **Drizzle ORM** — Query builder and schema management
- **connect-pg-simple** — PostgreSQL session store (available but not yet integrated)

### Frontend Libraries
- **@tanstack/react-query** — Async state management and API caching
- **Radix UI** — Full suite of accessible UI primitives (dialog, dropdown, tabs, etc.)
- **shadcn/ui** — Pre-built component library built on Radix
- **wouter** — Lightweight routing
- **react-hook-form** + **@hookform/resolvers** — Form handling with Zod validation
- **embla-carousel-react** — Carousel component
- **react-day-picker** — Calendar/date picker
- **input-otp** — OTP input component for MFA
- **recharts** — Charts library
- **vaul** — Drawer component
- **date-fns** — Date utility library
- **cmdk** — Command menu component

### Build Tools
- **Vite** — Frontend bundler with React plugin and Tailwind CSS plugin
- **esbuild** — Server bundler for production
- **tsx** — TypeScript execution for development
- **@replit/vite-plugin-runtime-error-modal** — Dev error overlay
- **@replit/vite-plugin-cartographer** and **@replit/vite-plugin-dev-banner** — Replit-specific dev plugins

### Validation
- **Zod** — Schema validation (shared between client and server)
- **drizzle-zod** — Generates Zod schemas from Drizzle table definitions
- **zod-validation-error** — Human-readable validation error messages