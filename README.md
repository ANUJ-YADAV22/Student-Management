# Student Information Management System (Three-Tier Cloud Architecture)

A robust, enterprise-grade three-tier Student Information Management System deployed across independent cloud providers:
- **Presentation Tier (Frontend):** React + Vite SPA hosted on **Vercel** / **Netlify**
- **Application Tier (Backend):** Node.js + Express REST API hosted on **Render**
- **Database Tier (Data Layer):** Managed MongoDB cluster on **MongoDB Atlas** (`studentDB` database, `students` collection)

---

## 🏛️ Architecture Overview

```
                   INTERNET / CLIENT
                           │
                           ▼ HTTPS
             ┌───────────────────────────┐
             │       TIER 1: FRONTEND     │
             │   Vercel / Netlify        │
             │   React + Vite SPA        │
             └─────────────┬─────────────┘
                           │
                           │ HTTPS / REST API
                           ▼
             ┌───────────────────────────┐
             │       TIER 2: BACKEND     │
             │   Render Web Service      │
             │   Node.js / Express API   │
             └─────────────┬─────────────┘
                           │
                           │ Mongoose (TLS/SSL)
                           ▼
             ┌───────────────────────────┐
             │      TIER 3: DATABASE     │
             │   MongoDB Atlas           │
             │   studentDB.students      │
             └───────────────────────────┘
```

> **Security Rule:** The frontend never connects directly to or contains the MongoDB URI. All database access is mediated strictly through the backend API.

---

## 📂 Project Structure

```
├── .gitignore
├── render.yaml                 # Infrastructure-as-code for Render deployment
├── README.md
├── backend/
│   ├── server.js               # Express app, CORS configuration, healthcheck
│   ├── package.json
│   ├── .env.example
│   ├── config/
│   │   └── database.js         # Resilient Mongoose connection with backoff & hints
│   ├── models/
│   │   └── Student.js          # Mongoose schema for Student
│   ├── routes/
│   │   └── studentRoutes.js    # CRUD route definitions
│   └── controllers/
│       └── studentController.js# Business logic & server-side validation
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── vercel.json             # SPA rewrites configuration
    └── src/
        ├── App.jsx             # Main dashboard & tier view
        ├── App.css
        ├── index.css
        ├── main.jsx
        ├── api/
        │   └── client.js       # Centralized REST API client
        └── components/
            ├── Navbar.jsx      # Navigation bar & live health status
            ├── StudentList.jsx # Student data table, filters, delete confirmation
            └── StudentForm.jsx # Add & Edit student modal dialog
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service and database health check (`status`, `dbState`) |
| `GET` | `/api/students` | Retrieve all student records (supports search & filter) |
| `GET` | `/api/students/:id` | Retrieve student by ID or Mongo `_id` |
| `POST` | `/api/students` | Create a new student record (with validation) |
| `PUT` | `/api/students/:id` | Update an existing student record |
| `DELETE` | `/api/students/:id` | Remove a student record |

---

## ⚙️ Environment Variables

### Backend (`Render`)
| Variable | Description |
|---|---|
| `PORT` | Listening port (default `5000`) |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/studentDB?retryWrites=true&w=majority` |
| `FRONTEND_URL` | Comma-separated list of allowed frontend origins (e.g. `https://student-management.vercel.app`) |

### Frontend (`Vercel`)
| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Render backend URL (no trailing slash, e.g. `https://student-api.onrender.com`) |

---

## 🚀 Deployment Instructions

### 1. MongoDB Atlas Setup
1. Create a free M0 cluster on MongoDB Atlas.
2. In **Database Access**, create user `studentapp` with built-in role `readWrite` on database `studentDB`.
3. In **Network Access**, add `0.0.0.0/0` (required because Render free tier utilizes dynamic IP addresses).
4. Copy the connection string format: `mongodb+srv://studentapp:<password>@<cluster>.mongodb.net/studentDB?retryWrites=true&w=majority`.

### 2. Backend Deployment on Render
1. Connect GitHub repository `ANUJ-YADAV22/Student-Management`.
2. Create a new **Web Service**:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Health Check Path:** `/api/health`
3. Configure Environment Variables: `MONGODB_URI`, `PORT=5000`, `NODE_ENV=production`, `FRONTEND_URL`.
4. Deploy and verify `/api/health` returns `dbState: "connected"`.

### 3. Frontend Deployment on Vercel
1. Import repository on Vercel:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
2. Set Environment Variable:
   - `VITE_API_BASE_URL` = your Render service URL (e.g. `https://student-api.onrender.com`)
3. Deploy to production.
4. Update `FRONTEND_URL` on Render to include your Vercel URL and trigger a redeploy of the backend.
