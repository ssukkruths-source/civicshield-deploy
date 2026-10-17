# 🛡️ CIVICSHIELD — Municipal Infrastructure Hazard & Utility Outage Dispatcher

> **Report hazards. Track action. Protect communities.**  
> A full-stack, hackathon-ready public infrastructure reporting and rapid municipal dispatch platform.

---

## 📌 1. Problem Statement & Solution

When public utilities fail—such as **fallen high-voltage cables, burst water mains, open sewer manholes, sinkholes, or broken streetlights**—municipal phone lines become bottlenecked. Citizens have no visibility into whether emergency crews are already responding, leading to duplicate calls and delayed triage.

**CivicShield** solves this civic-tech challenge by providing:
1. **Public Citizen Dashboard**: Real-time hazard map, KPI emergency statistics, searchable registry, and transparent tracking.
2. **Citizen Submission Portal**: Fast mobile-responsive reporting with landmark descriptions, browser GPS geolocation, urgency rating, and photo evidence.
3. **Smart Duplicate Detection**: Scans active reports within the same sector and time window (24h) to avoid duplicate dispatches while keeping citizens informed.
4. **Unique Incident Tracking ID (`CS-YYYY-XXXX`)**: Allows citizens to monitor dispatch status and repair progress anytime.
5. **Municipal Staff Dispatch Console**: Role-based triage for **Dispatchers** (triage, acknowledge, prioritize, assign crews) and **Field Crews** (arrival logging, on-site hazard verification, and resolution records with proof photos).

---

## 🏗️ 2. Technology Stack & Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       CIVICSHIELD FRONTEND                      │
│             React 18 + Vite + Tailwind CSS + Lucide Icons       │
│             Leaflet OpenStreetMap (Geospatial Hazard Pins)      │
└───────────────────────────────┬─────────────────────────────────┘
                                │ REST API Requests
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CIVICSHIELD BACKEND API                     │
│         Node.js + Express.js + Rate Limiting + Validation       │
│         Duplicate Hazard Detection Engine + State Machine       │
└───────────────────────────────┬─────────────────────────────────┘
                                │ RLS Enforced Queries
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE POSTGRESQL DB                      │
│     Tables: profiles, incidents, incident_logs, RLS Policies    │
│        (Dual-Mode: Automatic In-Memory Seed Fallback)           │
└─────────────────────────────────────────────────────────────────┘
```

- **Frontend**: React (Vite), Tailwind CSS, Lucide React, Leaflet & `react-leaflet`.
- **Backend**: Node.js, Express.js, `cors`, `dotenv`, `express-rate-limit`, `@supabase/supabase-js`.
- **Database**: Supabase PostgreSQL (SQL migration script with tables, constraints, indexes, RLS, and seed data).
- **Security**: Central error handling, input sanitization, rate limiting on submissions, role-based middleware, and no client-side secret exposure.

---

## 🚀 3. Quick Start Guide (Run Locally)

The application features **Zero-Config Dual-Mode**: It comes pre-seeded with realistic municipal demo data, so you can test all features immediately even before setting up Supabase!

### Prerequisites
- Node.js (v18 or higher) & npm

### Step 1: Start the Backend Server
```bash
# Navigate to server directory
cd server

# Install dependencies (already completed)
npm install

# Start Express API (runs on port 5000)
npm run dev
```

Verify backend health at: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### Step 2: Start the Frontend Application
Open a second terminal window:
```bash
# Navigate to client directory
cd client

# Install dependencies (already completed)
npm install

# Start Vite dev server (runs on port 5173)
npm run dev
```

Open your browser and navigate to: **[http://localhost:5173](http://localhost:5173)**

---

## 🗄️ 4. Supabase Database Setup (Live PostgreSQL)

Follow these simple steps to link CivicShield to your live Supabase database:

1. **Create a Free Project**:
   - Go to [https://supabase.com](https://supabase.com) and log in.
   - Click **"New Project"**, name it `civicshield-db`, and set a database password.

2. **Run the Database Schema**:
   - In your Supabase dashboard, click **"SQL Editor"** from the left navigation.
   - Click **"New query"**.
   - Copy the entire contents of [`supabase/schema.sql`](file:///C:/Users/ssukk/.gemini/antigravity-ide/scratch/civicshield/supabase/schema.sql) and paste it into the editor.
   - Click **"Run"**.
   - This creates:
     - `profiles` table (municipal staff & crew accounts)
     - `incidents` table (infrastructure hazard registry)
     - `incident_logs` table (immutable status change audit trail)
     - Indexes and Row-Level Security (RLS) policies
     - 5 realistic demo seed incidents and audit logs.

3. **Configure Backend Environment Variables**:
   - In Supabase, go to **Project Settings** → **API**.
   - Copy your **Project URL** and **service_role key** (secret key).
   - In the `server/.env` file, set:
     ```env
     PORT=5000
     NODE_ENV=development
     CLIENT_URL=http://localhost:5173
     SUPABASE_URL=https://your-project-id.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
     ```
   - Restart the server. The backend will log: `[CivicShield] Connected to Supabase PostgreSQL at: https://your-project-id.supabase.co`.

---

## 🧪 5. Automated Verification Test Suite

To verify all validation rules, duplicate detection, and dispatch workflows against the running server, run:

```bash
cd server
node test_flows.js
```

### Validation Suite Results:
- `✅ Health check endpoint returns 200 Healthy`
- `✅ Stats endpoint returns aggregate numbers`
- `✅ Validation rejects incomplete incident report`
- `✅ Creates valid incident and generates reference ID`
- `✅ Duplicate detection detects matching category in same area within 24h`
- `✅ Force submit bypasses duplicate detection when explicitly confirmed`
- `✅ Public tracking by reference ID returns correct incident`
- `✅ Rejects crew assignment without staff credentials`
- `✅ Authorized dispatcher acknowledges incident`
- `✅ Dispatcher assigns field crew and status transitions to Dispatched`
- `✅ Field crew records on-site verification and moves status to On Site`
- `✅ Field crew marks incident Resolved with audit notes`
- `✅ Persists full audit trail history (5 status change log entries)`

---

## 🔄 6. End-to-End Operational Lifecycle

```
[Citizen Submits Report] 
       │
       ▼
[Backend Validation & Duplicate Check]
       │
       ▼
[Saved to Database with Reference ID: CS-2026-XXXX]
       │
       ▼
[Public Dashboard & Live Map Update]
       │
       ▼
[Dispatcher Acknowledges & Assigns Field Crew Unit] ──► Status: "Dispatched"
       │
       ▼
[Field Crew Arrives & Records Hazard Verification]  ──► Status: "On Site"
       │
       ▼
[Field Crew Completes Repair & Posts Photo Evidence]──► Status: "Resolved"
       │
       ▼
[Full Audit Trail Recorded in incident_logs]
```

### Incident Statuses
- `Submitted`: Initial citizen report received.
- `Acknowledged`: Dispatch triage officer verified severity.
- `Dispatched`: Certified field repair crew assigned and en route.
- `On Site`: Crew arrived, secured perimeter, and recorded verification findings.
- `Resolved`: Repairs completed, safety tests passed, and resolution logged.
- `Rejected`: Deemed out of municipal jurisdiction or duplicate non-hazard.

---

## 📡 7. REST API Documentation

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/health` | Public | System health check and database connection state |
| **GET** | `/api/dashboard/stats` | Public | Real-time counts (Total, Critical, In Progress, Resolved, Categories) |
| **GET** | `/api/incidents` | Public | Query incidents with search, filters (`category`, `urgency`, `status`, `area`), and sorting |
| **GET** | `/api/incidents/:id` | Public | Get single incident with full audit logs |
| **GET** | `/api/incidents/reference/:refId` | Public | Track incident by tracking code (e.g. `CS-2026-1001`) |
| **POST**| `/api/incidents` | Public (Rate-limited)| Submit new hazard report with duplicate check |
| **PATCH**| `/api/incidents/:id/status`| Staff Protected | Update status (`Acknowledged`, `Rejected`, etc.) |
| **PATCH**| `/api/incidents/:id/assign`| Dispatcher Protected| Assign certified field crew to incident |
| **POST** | `/api/incidents/:id/verification`| Field Crew Protected| Record on-site assessment and safety notes |
| **POST** | `/api/incidents/:id/resolution`| Field Crew Protected| Mark resolved with repair notes and photo |
| **GET** | `/api/staff` | Staff Protected | Directory of field response teams |

---

## 🌐 8. Deployment Guide

### Deploy Backend to Render (Free Web Service)
1. Push your repository to GitHub.
2. Sign up at [Render.com](https://render.com) and click **"New Web Service"**.
3. Connect your repository and select the `server` directory as the root.
4. Set:
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add Environment Variables:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Key
   - `ALLOWED_ORIGINS`: Your Vercel frontend URL
6. Deploy and copy your live backend URL (e.g., `https://civicshield-api.onrender.com`).

### Deploy Frontend to Vercel (Free Static / SPA)
1. Go to [Vercel.com](https://vercel.com) and click **"Add New Project"**.
2. Select your repository and set the **Root Directory** to `client`.
3. Framework Preset: **Vite**.
4. Set Environment Variables:
   - `VITE_API_BASE_URL`: `https://civicshield-api.onrender.com/api`
5. Click **"Deploy"**. Your application is live!

---

## 🏆 9. Hackathon Presentation & Evaluation Defense

| Judging Criterion | How CivicShield Excels |
| :--- | :--- |
| **Problem Relevance** | Solves dangerous utility emergency delays (electrical wires, water mains, sewer manholes) with transparent citizen-to-crew routing. |
| **Technical Innovation** | Algorithmic **duplicate incident detection** compares category, 24h time-window, and ~500m GPS radius before creating tickets. |
| **Full-Stack Implementation** | Fully functional React + Vite frontend, Express REST API, and Supabase PostgreSQL with RLS, audit logs, and rate limiting. |
| **UI/UX Excellence** | Clean government navy/teal aesthetics, responsive layout, interactive OpenStreetMap with urgency pins, and progress timelines. |
| **Security & Architecture** | Strict separation of concerns, parameterized queries, centralized error handling, and zero client-side secret exposure. |
