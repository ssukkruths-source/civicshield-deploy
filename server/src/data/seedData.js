export const INITIAL_STAFF = [
  {
    id: 'staff-admin',
    full_name: 'Commander Sarah Jenkins',
    email: 'admin@civicshield.gov',
    role: 'admin',
    badge_number: 'ADM-001',
    department: 'Municipal Operations Bureau',
    password: 'admin'
  },
  {
    id: 'staff-001',
    full_name: 'Officer Davis',
    email: 'davis@civicshield.gov',
    role: 'dispatcher',
    badge_number: 'DSP-104',
    department: 'Central Emergency Dispatch',
    password: 'admin'
  },
  {
    id: 'staff-002',
    full_name: 'Alex Rivera (Rapid Crew #4)',
    email: 'rivera@civicshield.gov',
    role: 'field_crew',
    badge_number: 'FC-402',
    department: 'Electrical & Utility Infrastructure',
    password: 'crew'
  },
  {
    id: 'staff-003',
    full_name: 'Maya Chen (Roadway Safety)',
    email: 'chen@civicshield.gov',
    role: 'field_crew',
    badge_number: 'FC-209',
    department: 'Public Works & Roadways',
    password: 'crew'
  },
  {
    id: 'staff-004',
    full_name: 'Marcus Vance (Water & Sewer)',
    email: 'vance@civicshield.gov',
    role: 'field_crew',
    badge_number: 'FC-311',
    department: 'Hydraulics & Drainage',
    password: 'crew'
  }
];

export const INITIAL_INCIDENTS = [
  {
    id: 'inc-001',
    reference_id: 'CS-2026-1001',
    title: 'High-Voltage Cable Snapped Across Transit Lane',
    description: 'Live sparking electrical wire severed from utility pole during wind gust. Blocking westbound bicycle and vehicle lane near metro gate.',
    category: 'Fallen Electrical Cable',
    urgency: 'Critical',
    landmark: 'Opposite City Center Metro Exit 3',
    area: 'Downtown Sector 4',
    latitude: 40.7128,
    longitude: -74.0060,
    photo_url: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=800&q=80',
    status: 'Dispatched',
    reporter_id: null,
    reporter_contact: 'citizen.reports@civicshield.net',
    assigned_crew_id: 'staff-002',
    assigned_crew_name: 'Alex Rivera (Rapid Crew #4)',
    verification_notes: 'Confirmed live 440V line. Perimeter established with cones.',
    resolution_notes: null,
    resolution_photo_url: null,
    is_demo: true,
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    resolved_at: null,
    logs: [
      {
        id: 'log-001a',
        actor_name: 'Citizen Reporter',
        previous_status: null,
        new_status: 'Submitted',
        notes: 'Initial citizen report received via CivicShield portal.',
        created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
      },
      {
        id: 'log-001b',
        actor_name: 'Central Dispatcher (Officer Davis)',
        previous_status: 'Submitted',
        new_status: 'Acknowledged',
        notes: 'Hazard severity confirmed. Rapid response alert sent.',
        created_at: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString()
      },
      {
        id: 'log-001c',
        actor_name: 'Central Dispatcher (Officer Davis)',
        previous_status: 'Acknowledged',
        new_status: 'Dispatched',
        notes: 'Assigned to Alex Rivera (Rapid Crew #4). In transit.',
        created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'inc-002',
    reference_id: 'CS-2026-1002',
    title: 'Sub-Surface Water Main Rupture Flooding Sidewalk',
    description: 'Pressurized clean water gushing from beneath pedestrian walkway. Water depth ~6 inches causing foundation erosion near commercial block.',
    category: 'Burst Water Main',
    urgency: 'Critical',
    landmark: 'Near Oakridge Public Library, East Wing',
    area: 'Northgate District',
    latitude: 40.7282,
    longitude: -73.9942,
    photo_url: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=800&q=80',
    status: 'On Site',
    reporter_id: null,
    reporter_contact: null,
    assigned_crew_id: 'staff-004',
    assigned_crew_name: 'Marcus Vance (Water & Sewer)',
    verification_notes: 'Main distribution valve located. Shutoff in progress to prevent road subsidence.',
    resolution_notes: null,
    resolution_photo_url: null,
    is_demo: true,
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    resolved_at: null,
    logs: [
      {
        id: 'log-002a',
        actor_name: 'Citizen Reporter',
        previous_status: null,
        new_status: 'Submitted',
        notes: 'Citizen report with photo submitted.',
        created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
      },
      {
        id: 'log-002b',
        actor_name: 'Officer Davis',
        previous_status: 'Submitted',
        new_status: 'Dispatched',
        notes: 'Water Department emergency response crew dispatched.',
        created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      },
      {
        id: 'log-002c',
        actor_name: 'Marcus Vance (Water & Sewer)',
        previous_status: 'Dispatched',
        new_status: 'On Site',
        notes: 'Arrived on scene with emergency excavation truck.',
        created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'inc-003',
    reference_id: 'CS-2026-1003',
    title: 'Open Stormwater Manhole Missing Cast-Iron Cover',
    description: 'Deep uncovered sewer/storm drain manhole on busy pedestrian crosswalk. Severe fall hazard for cyclists and pedestrians.',
    category: 'Open Sewer Manhole',
    urgency: 'Critical',
    landmark: 'Intersection of 5th Ave and Elm St',
    area: 'Westside Ward 2',
    latitude: 40.7180,
    longitude: -74.0020,
    photo_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    status: 'Acknowledged',
    reporter_id: null,
    reporter_contact: 'neighborhood.watch@westside.org',
    assigned_crew_id: null,
    assigned_crew_name: null,
    verification_notes: null,
    resolution_notes: null,
    resolution_photo_url: null,
    is_demo: true,
    created_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    resolved_at: null,
    logs: [
      {
        id: 'log-003a',
        actor_name: 'Citizen Reporter',
        previous_status: null,
        new_status: 'Submitted',
        notes: 'Hazard flagged as Critical due to night traffic.',
        created_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString()
      },
      {
        id: 'log-003b',
        actor_name: 'Officer Davis',
        previous_status: 'Submitted',
        new_status: 'Acknowledged',
        notes: 'Acknowledged by dispatcher. Queueing crew dispatch.',
        created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'inc-004',
    reference_id: 'CS-2026-1004',
    title: 'Deep Asphalt Sinkhole in Bus Rapid Transit Lane',
    description: 'Pothole expanded into 4-foot wide cavity following morning rainfall. Wheel damage risk for city transit buses.',
    category: 'Damaged Road',
    urgency: 'Medium',
    landmark: 'Bus Stop 14B, Harbor Boulevard',
    area: 'Harborfront Sector 7',
    latitude: 40.7050,
    longitude: -74.0150,
    photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    status: 'Submitted',
    reporter_id: null,
    reporter_contact: null,
    assigned_crew_id: null,
    assigned_crew_name: null,
    verification_notes: null,
    resolution_notes: null,
    resolution_photo_url: null,
    is_demo: true,
    created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    resolved_at: null,
    logs: [
      {
        id: 'log-004a',
        actor_name: 'Citizen Reporter',
        previous_status: null,
        new_status: 'Submitted',
        notes: 'Automated ingestion from public web portal.',
        created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'inc-005',
    reference_id: 'CS-2026-1005',
    title: 'Consecutive Streetlight Array Blackout',
    description: 'Six consecutive high-pressure sodium streetlights completely dark along school walking corridor.',
    category: 'Streetlight Failure',
    urgency: 'Low',
    landmark: 'Adjacent to Lincoln Elementary School',
    area: 'Pine Crest Ward 9',
    latitude: 40.7350,
    longitude: -73.9850,
    photo_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    status: 'Resolved',
    reporter_id: null,
    reporter_contact: 'parent.pta@pinecrest.edu',
    assigned_crew_id: 'staff-002',
    assigned_crew_name: 'Alex Rivera (Rapid Crew #4)',
    verification_notes: 'Blown transformer fuse on secondary line.',
    resolution_notes: 'Replaced 40A pole fuse and verified light sensors on all 6 luminaires.',
    resolution_photo_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    is_demo: true,
    created_at: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    resolved_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    logs: [
      {
        id: 'log-005a',
        actor_name: 'Citizen Reporter',
        previous_status: null,
        new_status: 'Submitted',
        notes: 'Citizen report logged.',
        created_at: new Date(Date.now() - 26 * 3600 * 1000).toISOString()
      },
      {
        id: 'log-005b',
        actor_name: 'Officer Davis',
        previous_status: 'Submitted',
        new_status: 'Dispatched',
        notes: 'Dispatched crew during day maintenance shift.',
        created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
      },
      {
        id: 'log-005c',
        actor_name: 'Alex Rivera (Rapid Crew #4)',
        previous_status: 'Dispatched',
        new_status: 'On Site',
        notes: 'Crew arrived with cherry picker.',
        created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
      },
      {
        id: 'log-005d',
        actor_name: 'Alex Rivera (Rapid Crew #4)',
        previous_status: 'On Site',
        new_status: 'Resolved',
        notes: 'Work completed. Luminaire line restored and tested.',
        created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
      }
    ]
  }
];
