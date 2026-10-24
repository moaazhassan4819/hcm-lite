# HCM Lite – Human Capital Management System

A beginner-friendly MERN stack HCM system built for hackathons.

## Features

- **Fresh Start**: Empty database. First run creates Admin + Company.
- **3 Roles**: Admin, HR, Employee (JWT + server-side RBAC)
- **Modules**:
  1. Auth & Access
  2. Organization Setup (Company, Departments, Leave Types, Geo radius)
  3. Employees Management
  4. Attendance (Check-in/out, late tracking)
  5. Leave Management
  6. Payroll Lite
  7. Dashboards
  8. AI Assistant (Groq + tool calling)

## Tech Stack

- Frontend: React + Vite (in `web/`)
- Backend: Node.js + Express
- Database: MongoDB (Mongoose)
- AI: Groq API (`llama-3.3-70b-versatile`)

## Quick Start

### 1. Prerequisites
- Node.js 18+
- MongoDB running locally (or Atlas URI)

### 2. Setup

```bash
# Install backend deps
npm install

# Install frontend deps
cd web && npm install && cd ..

# Copy env and fill values
cp .env.example .env
# Edit .env:
#   MONGODB_URI=mongodb://127.0.0.1:27017/hcm-lite
#   JWT_SECRET=any_random_secret
#   GROQ_API_KEY=your_groq_key   (optional for AI)
```

### 3. Run (Development)

```bash
# Terminal 1 – Backend
npm run dev

# Terminal 2 – Frontend
cd web && npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

### 4. Production Build

```bash
cd web && npm run build && cd ..
npm start
```

Then open http://localhost:8000 (serves React from `web/dist`)

## First Run Flow

1. Open the app → redirected to `/setup`
2. Create Admin account + Company name
3. Login as Admin
4. Go to **Settings** → add Departments & Leave Types
5. Go to **Employees** → register employees (they get temp password)
6. Employees login → forced to change password
7. Use Attendance, Leaves, Payroll, AI Assistant

## Project Structure

```
hcm-lite/
├── server.js              # Express entry
├── package.json
├── .env                   # Fill your values
├── src/
│   ├── config/db.js
│   ├── models/            # User, Company, Department, LeaveType, Attendance, Leave, Payroll
│   ├── controllers/
│   ├── routes/
│   ├── middleware/auth.js
│   └── utils/
└── web/                   # React frontend
    ├── src/
    │   ├── api.js
    │   ├── context/AuthContext.jsx
    │   ├── components/Layout.jsx
    │   └── pages/         # Setup, Login, Dashboard, Employees, ...
    └── dist/              # Production build (after npm run build)
```

## Demo Tips (Hackathon)

1. Start with empty MongoDB
2. Setup Admin live
3. Add 1-2 departments + leave types
4. Create 2 employees
5. Check-in as employee
6. Apply leave → approve as HR/Admin
7. Generate payroll
8. Ask AI: "How many employees are present today?"

## License

MIT – Built for learning & hackathons.
