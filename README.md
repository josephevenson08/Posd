# POSD Portable Setup

This repository contains:

- `frontend/` - React frontend
- `backend/` - Express + TypeScript backend
- `database/doctor_patient_db_dump.sql` - portable SQL dump from the local working database

## Local development

1. Install MySQL, Node.js 18+, and Git.
2. Create a MySQL database named `doctor_patient_db`.
3. Import `database/doctor_patient_db_dump.sql` into that database.
4. Create `backend/.env` from `backend/.env.example`.
5. Start the backend:

```powershell
cd backend
npm install
npm run db:push
npm run dev
```

6. Start the frontend in a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

7. Open `http://localhost:5000`.

## Railway deployment

This repo is set up for a single Railway web service plus one Railway MySQL service.

### What gets deployed

- Railway web service runs the backend
- The backend serves the built frontend in production
- MySQL stores app data, login sessions, and OTP verification records
- OTP emails are sent through your real SMTP provider

### Required Railway environment variables

Set these on the Railway web service:

```env
DATABASE_URL=mysql://user:password@host:3306/doctor_patient_db
PORT=5001
SESSION_SECRET=replace-with-a-long-random-secret
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM="Doctor Portal <no-reply@yourdomain.com>"
```

### Gmail SMTP settings

If you want to use Gmail for OTP email, use:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=your-16-character-google-app-password
SMTP_FROM="Doctor Portal <yourgmail@gmail.com>"
```

Important:

- Turn on 2-Step Verification for the Gmail account first
- Create a Google App Password and use that as `SMTP_PASS`
- Do not use your normal Gmail password
- Gmail is fine for small-scale/testing use, but for larger production traffic a mail provider like SendGrid, Mailgun, or Postmark is usually more reliable

### Railway steps

1. Push this repo to GitHub.
2. In Railway, create a new project from the GitHub repo.
3. Add a MySQL service to that Railway project.
4. Copy the MySQL connection string into the web service as `DATABASE_URL`.
5. Add the other environment variables above.
6. Deploy the web service.
7. After the first deploy, open a Railway shell for the web service and run:

```bash
cd backend && npm run db:push
```

8. Import your existing SQL dump into the Railway MySQL database if you want your current data there.

### Importing your SQL dump into Railway MySQL

You have a dump already at:

- `database/doctor_patient_db_dump.sql`

Simple import flow:

1. In Railway, open your MySQL service.
2. Copy the public connection details or connection string.
3. On your computer, make sure you have MySQL client tools installed.
4. Run an import command like this:

```bash
mysql -h <host> -P <port> -u <user> -p <database_name> < database/doctor_patient_db_dump.sql
```

Example:

```bash
mysql -h mysql.railway.internal -P 3306 -u root -p doctor_patient_db < database/doctor_patient_db_dump.sql
```

If Railway gives you a full `MYSQL_URL`, you can also connect with a GUI client like MySQL Workbench, TablePlus, or DBeaver and import the `.sql` file there.

After importing, run this once from the Railway app shell to make sure the new session and OTP tables exist too:

```bash
cd backend && npm run db:push
```

### Accessing the app

Once deployed, you can open the Railway-generated public URL from any device and use the app there.

## Notes

- Local dev frontend runs on `http://localhost:5000`
- Local dev backend runs on `http://localhost:5001`
- Production serves the frontend and backend from one public Railway URL
- OTP email now requires real SMTP configuration and is no longer using Ethereal test mail
- SMS OTP is not wired up yet; email OTP is production-ready, and SMS could be added later with Twilio or Vonage
