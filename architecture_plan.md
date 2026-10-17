# CIVICSHIELD Architecture & Implementation Plan

## 1. Executive Overview
CivicShield is a full-stack, hackathon-ready municipal infrastructure hazard and utility outage dispatcher.
Citizens can report hazardous civic issues (fallen electrical cables, burst water mains, open manholes, damaged roads, etc.) with real-time location/landmarks, urgency levels, and photos. Municipal staff (Dispatchers & Field Crews) operate an authenticated, role-based dispatcher portal to acknowledge incidents, dispatch crews, record on-site verification, and complete resolutions with full audit logs.

## 2. System Architecture & Tech Stack

```mermaid
graph TD
    User[Citizen Browser] -->|Public Incident Reports, Lookups, Map & Stats| FE[React + Vite Frontend (Tailwind/Modern CSS)]
    Staff[Municipal Staff (Admin/Crew)] -->|Auth & Dispatcher Workflow| FE
    FE -->|REST API Requests| BE[Node.js + Express REST API]
    BE -->|Query / RLS Enforced| DB[(Supabase PostgreSQL)]
    BE -->|Auth Verification| SA[Supabase Auth]
    DB -->|Tables: profiles, incidents, incident_logs| DB
```

### Frontend (`/client`)
- **Framework**: React 18 / 19 with Vite
- **Styling**: Modern, high-contrast, responsive civic-tech design palette (Deep Navy Blue `#0f172a` / `#1e293b`, Clean Slate White `#f8fafc`, Teal Accents `#0d9488` / `#14b8a6`, Urgency Badges: Amber/Rose/Emerald).
- **Icons**: Lucide React
- **Mapping**: Leaflet & OpenStreetMap (`react-leaflet` / `leaflet`) for interactive incident map with custom color-coded urgency pins.
- **Components**:
  - `Navbar`: Civic branding, quick search, "Report Hazard" CTA, Staff Portal link, and Demo Mode switcher.
  - `Hero & Stats Counter`: Real-time counts (Total, Critical, In Progress, Resolved) dynamically queried from database.
  - `IncidentCard` & `IncidentGrid`: Filterable by category, urgency, status; sortable by newest/urgency.
  - `IncidentMap`: Interactive OpenStreetMap displaying geocoded hazard pins.
  - `HazardReportModal`: Full citizen submission form with landmark, area, browser geolocation button, urgency level, photo URL/upload, and validation.
  - `DuplicateNoticeModal`: Proactive notice when a similar category hazard is detected in the same area within 24 hours. Allows citizen to view existing report or proceed.
  - `IncidentDetailsView`: Detailed page with tracking ID, full metadata, photo, progress timeline (`Submitted` → `Acknowledged` → `Dispatched` → `On Site` → `Resolved`), resolution notes, and audit log.
  - `StaffPortal`:
    - Dispatcher tab: incident triage, acknowledge, assign field crew, priority adjustments.
    - Field Crew tab: my assigned incidents, arrival marker ("On Site"), verification notes, completion ("Resolved") with resolution details.
  - `TrackReferenceModal`: Instant tracking by Reference ID (`CS-2026-XXXX`).

### Backend (`/server`)
- **Runtime**: Node.js + Express.js
- **Key Modules**: `cors`, `dotenv`, `express-rate-limit`, `@supabase/supabase-js`
- **Security & Reliability**:
  - Centralized error handler
  - Rate limiting on public submission endpoints
  - Input validation middleware (sanitizing titles, categories, urgency levels, coordinates)
  - Duplicate detection engine: scans records within the last 24h for matching category & area/radius.
  - State machine validation: enforces valid status transitions (`Submitted` -> `Acknowledged` -> `Dispatched` -> `On Site` -> `Resolved` / `Rejected`).
  - Seamless Dual Mode: Connects directly to Supabase PostgreSQL when credentials are provided in `.env`, with a full persistent/seeded fallback store so the hackathon demo operates immediately out-of-the-box.

### Database (`Supabase PostgreSQL`)
- **Tables**:
  1. `profiles`: `id` (UUID), `full_name`, `email`, `role` (`admin`/`dispatcher`, `field_crew`), `badge_number`, `created_at`
  2. `incidents`: `id` (UUID), `reference_id` (`CS-YYYY-XXXX`), `title`, `description`, `category`, `urgency` (`Low`, `Medium`, `Critical`), `landmark`, `area`, `latitude`, `longitude`, `photo_url`, `status` (`Submitted`, `Acknowledged`, `Dispatched`, `On Site`, `Resolved`, `Rejected`), `reporter_id` (nullable), `assigned_crew_id` (FK to profiles), timestamps (`created_at`, `updated_at`, `resolved_at`).
  3. `incident_logs`: `id`, `incident_id` (FK to incidents), `actor_id` (FK to profiles), `actor_name`, `previous_status`, `new_status`, `notes`, `created_at`.
- **Row-Level Security (RLS)**: Public read for verified fields, authenticated staff read/write for triage, secure update policies.

---
