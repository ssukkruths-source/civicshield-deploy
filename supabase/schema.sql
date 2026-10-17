-- ==============================================================================
-- CIVICSHIELD DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- Project: CivicShield - Municipal Infrastructure Hazard & Utility Outage Dispatcher
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean Up (For fresh migrations if re-running)
-- DROP TABLE IF EXISTS incident_logs CASCADE;
-- DROP TABLE IF EXISTS incidents CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- 3. Profiles Table (Staff & Crew Members)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'dispatcher', 'field_crew')),
    badge_number TEXT,
    department TEXT DEFAULT 'Municipal Public Works',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Incidents Table (Reported Infrastructure Hazards)
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_id VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (
        category IN (
            'Fallen Electrical Cable',
            'Burst Water Main',
            'Open Sewer Manhole',
            'Damaged Road',
            'Streetlight Failure',
            'Other Infrastructure Hazard'
        )
    ),
    urgency VARCHAR(20) NOT NULL CHECK (urgency IN ('Low', 'Medium', 'Critical')),
    landmark VARCHAR(255) NOT NULL,
    area VARCHAR(150) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    photo_url TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'Submitted' CHECK (
        status IN ('Submitted', 'Acknowledged', 'Dispatched', 'On Site', 'Resolved', 'Rejected')
    ),
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable for anonymous citizen reports
    reporter_contact VARCHAR(100),
    assigned_crew_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_crew_name VARCHAR(150),
    verification_notes TEXT,
    resolution_notes TEXT,
    resolution_photo_url TEXT,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 5. Incident Logs Table (Audit Trail & Status Timeline)
CREATE TABLE IF NOT EXISTS incident_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    actor_name VARCHAR(150) NOT NULL DEFAULT 'System / Dispatcher',
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Indexes for High-Performance Queries
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_urgency ON incidents(urgency);
CREATE INDEX IF NOT EXISTS idx_incidents_category ON incidents(category);
CREATE INDEX IF NOT EXISTS idx_incidents_area ON incidents(area);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_reference_id ON incidents(reference_id);
CREATE INDEX IF NOT EXISTS idx_incident_logs_incident_id ON incident_logs(incident_id);

-- 7. Trigger to Auto-Update updated_at Timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_incidents_timestamp ON incidents;
CREATE TRIGGER trigger_update_incidents_timestamp
BEFORE UPDATE ON incidents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 8. Row Level Security (RLS) Setup
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_logs ENABLE ROW LEVEL SECURITY;

-- 8a. Profiles Policies
-- Staff can view staff profiles for assignment dropdowns
CREATE POLICY "Public staff directory view" 
    ON profiles FOR SELECT 
    USING (true);

-- 8b. Incidents Policies
-- Public can read active incidents (excluding sensitive internal notes if any)
CREATE POLICY "Public can view incidents" 
    ON incidents FOR SELECT 
    USING (true);

-- Anyone can submit an incident (handled safely via backend validation or direct insert)
CREATE POLICY "Anyone can report an incident" 
    ON incidents FOR INSERT 
    WITH CHECK (true);

-- Authenticated staff can update incidents
CREATE POLICY "Staff can update incidents" 
    ON incidents FOR UPDATE 
    TO authenticated 
    USING (true);

-- 8c. Incident Logs Policies
CREATE POLICY "Public can view incident history" 
    ON incident_logs FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated staff can add logs" 
    ON incident_logs FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- ==============================================================================
-- 9. DEMO SEED DATA (Hackathon-Ready & Clearly Marked with is_demo = true)
-- ==============================================================================

INSERT INTO incidents (
    reference_id, title, description, category, urgency, landmark, area, 
    latitude, longitude, photo_url, status, is_demo, created_at, updated_at
) VALUES 
(
    'CS-2026-1001',
    'High-Voltage Cable Snapped Across Transit Lane',
    'Live sparking electrical wire severed from utility pole during wind gust. Blocking westbound bicycle and vehicle lane near metro gate.',
    'Fallen Electrical Cable',
    'Critical',
    'Opposite City Center Metro Exit 3',
    'Downtown Sector 4',
    40.7128, -74.0060,
    'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=800&q=80',
    'Dispatched',
    TRUE,
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '1 hour'
),
(
    'CS-2026-1002',
    'Sub-Surface Water Main Rupture Flooding Sidewalk',
    'Pressurized clean water gushing from beneath pedestrian walkway. Water depth ~6 inches causing foundation erosion near commercial block.',
    'Burst Water Main',
    'Critical',
    'Near Oakridge Public Library, East Wing',
    'Northgate District',
    40.7282, -73.9942,
    'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=800&q=80',
    'On Site',
    TRUE,
    NOW() - INTERVAL '5 hours',
    NOW() - INTERVAL '40 minutes'
),
(
    'CS-2026-1003',
    'Open Stormwater Manhole Missing Cast-Iron Cover',
    'Deep uncovered sewer/storm drain manhole on busy pedestrian crosswalk. Hazardous for cyclists and night pedestrians.',
    'Open Sewer Manhole',
    'Critical',
    'Intersection of 5th Ave and Elm St',
    'Westside Ward 2',
    40.7180, -74.0020,
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    'Acknowledged',
    TRUE,
    NOW() - INTERVAL '8 hours',
    NOW() - INTERVAL '2 hours'
),
(
    'CS-2026-1004',
    'Deep Asphalt Sinkhole in Bus Rapid Transit Lane',
    'Pothole expanded into 4-foot wide cavity following morning rainfall. Wheel damage risk for city transit buses.',
    'Damaged Road',
    'Medium',
    'Bus Stop 14B, Harbor Boulevard',
    'Harborfront Sector 7',
    40.7050, -74.0150,
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    'Submitted',
    TRUE,
    NOW() - INTERVAL '12 hours',
    NOW() - INTERVAL '12 hours'
),
(
    'CS-2026-1005',
    'Consecutive Streetlight Array Blackout',
    'Six consecutive high-pressure sodium streetlights completely dark along school walking corridor.',
    'Streetlight Failure',
    'Low',
    'Adjacent to Lincoln Elementary School',
    'Pine Crest Ward 9',
    40.7350, -73.9850,
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    'Resolved',
    TRUE,
    NOW() - INTERVAL '26 hours',
    NOW() - INTERVAL '3 hours'
)
ON CONFLICT (reference_id) DO NOTHING;

-- Insert initial audit logs for the seed incidents
INSERT INTO incident_logs (incident_id, actor_name, previous_status, new_status, notes, created_at)
SELECT id, 'Citizen Reporter', NULL, 'Submitted', 'Initial citizen report received via CivicShield portal.', created_at
FROM incidents WHERE is_demo = TRUE
ON CONFLICT DO NOTHING;

INSERT INTO incident_logs (incident_id, actor_name, previous_status, new_status, notes, created_at)
SELECT id, 'Central Dispatcher (Officer Davis)', 'Submitted', 'Acknowledged', 'Dispatched triage officer reviewed hazard severity and notified rapid response team.', created_at + INTERVAL '20 minutes'
FROM incidents WHERE is_demo = TRUE AND status IN ('Acknowledged', 'Dispatched', 'On Site', 'Resolved')
ON CONFLICT DO NOTHING;

INSERT INTO incident_logs (incident_id, actor_name, previous_status, new_status, notes, created_at)
SELECT id, 'Central Dispatcher (Officer Davis)', 'Acknowledged', 'Dispatched', 'Rapid Response Utility Crew Unit #4 deployed to coordinates.', created_at + INTERVAL '45 minutes'
FROM incidents WHERE is_demo = TRUE AND status IN ('Dispatched', 'On Site', 'Resolved')
ON CONFLICT DO NOTHING;

INSERT INTO incident_logs (incident_id, actor_name, previous_status, new_status, notes, created_at)
SELECT id, 'Lead Crew Tech (Alex Rivera)', 'Dispatched', 'On Site', 'Field crew arrived with perimeter barriers and diagnostic equipment.', created_at + INTERVAL '1 hour 15 minutes'
FROM incidents WHERE is_demo = TRUE AND status IN ('On Site', 'Resolved')
ON CONFLICT DO NOTHING;

INSERT INTO incident_logs (incident_id, actor_name, previous_status, new_status, notes, created_at)
SELECT id, 'Lead Crew Tech (Alex Rivera)', 'On Site', 'Resolved', 'Replaced damaged ballast and high-voltage wiring. Tested illuminated line successfully.', created_at + INTERVAL '3 hours'
FROM incidents WHERE is_demo = TRUE AND status = 'Resolved'
ON CONFLICT DO NOTHING;
