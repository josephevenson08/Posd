# POSD Portable Setup

This repository contains:

- `frontend/` - React frontend
- `backend/` - Express + TypeScript backend
- `database/doctor_patient_db_dump.sql` - portable SQL dump from the local working database

## Run on another laptop

1. Install MySQL, Node.js 18+, and Git.
2. Create a MySQL database named `doctor_patient_db`.
3. Import `database/doctor_patient_db_dump.sql` into that database.
4. Create `backend/.env` from `backend/.env.example`.
5. Start the backend:

```powershell
cd backend
npm install
npm run dev
```

6. Start the frontend in a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

7. Open `http://localhost:5000`.

## Notes

- Backend runs on `http://localhost:5001`
- Frontend runs on `http://localhost:5000`
- OTP codes are logged directly in the backend terminal for local development
