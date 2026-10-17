import { supabase, isConnected } from '../config/supabase.js';
import { INITIAL_INCIDENTS, INITIAL_STAFF } from '../data/seedData.js';
import { detectDuplicateIncident } from './duplicateDetection.js';

// In-memory backing store for instant demo/offline capability
let memoryIncidents = [...INITIAL_INCIDENTS];
let memoryStaff = [...INITIAL_STAFF];

// Allowed categories and status values
export const VALID_CATEGORIES = [
  'Fallen Electrical Cable',
  'Burst Water Main',
  'Open Sewer Manhole',
  'Damaged Road',
  'Streetlight Failure',
  'Other Infrastructure Hazard'
];

export const VALID_URGENCIES = ['Low', 'Medium', 'Critical'];
export const VALID_STATUSES = ['Submitted', 'Acknowledged', 'Dispatched', 'On Site', 'Resolved', 'Rejected'];

// State Machine transitions
export const ALLOWED_TRANSITIONS = {
  'Submitted': ['Acknowledged', 'Dispatched', 'Rejected'],
  'Acknowledged': ['Dispatched', 'Rejected'],
  'Dispatched': ['On Site', 'Resolved', 'Rejected'],
  'On Site': ['Resolved', 'Rejected'],
  'Resolved': [], // Terminal
  'Rejected': []  // Terminal
};

// Generate Reference ID (e.g. CS-2026-8341)
export function generateReferenceId() {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `CS-${year}-${randomSuffix}`;
}

export const incidentService = {
  /**
   * Get all incidents with filtering, search, sorting and pagination
   */
  async getIncidents({ search, category, urgency, status, area, sort = 'newest', page = 1, limit = 20 }) {
    if (isConnected && supabase) {
      try {
        let query = supabase.from('incidents').select('*, logs:incident_logs(*)', { count: 'exact' });

        if (status) query = query.eq('status', status);
        if (urgency) query = query.eq('urgency', urgency);
        if (category) query = query.eq('category', category);
        if (area) query = query.ilike('area', `%${area}%`);
        if (search) {
          query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,landmark.ilike.%${search}%,reference_id.ilike.%${search}%`);
        }

        if (sort === 'urgency') {
          // Supabase custom sorting
          query = query.order('urgency', { ascending: false }).order('created_at', { ascending: false });
        } else {
          query = query.order('created_at', { ascending: false });
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

        const { data, count, error } = await query;
        if (!error && data) {
          return { incidents: data, total: count || data.length, page, limit };
        }
        console.warn('[CivicShield] Supabase query failed, falling back to memory store:', error?.message);
      } catch (err) {
        console.warn('[CivicShield] Supabase fetch exception:', err.message);
      }
    }

    // Fallback: Memory store filter and sort
    let filtered = [...memoryIncidents];

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(i =>
        i.title.toLowerCase().includes(s) ||
        i.description.toLowerCase().includes(s) ||
        i.landmark.toLowerCase().includes(s) ||
        i.area.toLowerCase().includes(s) ||
        i.reference_id.toLowerCase().includes(s)
      );
    }

    if (category) filtered = filtered.filter(i => i.category === category);
    if (urgency) filtered = filtered.filter(i => i.urgency === urgency);
    if (status) filtered = filtered.filter(i => i.status === status);
    if (area) filtered = filtered.filter(i => i.area.toLowerCase().includes(area.toLowerCase()));

    if (sort === 'urgency') {
      const urgencyWeight = { 'Critical': 3, 'Medium': 2, 'Low': 1 };
      filtered.sort((a, b) => {
        const diff = (urgencyWeight[b.urgency] || 0) - (urgencyWeight[a.urgency] || 0);
        if (diff !== 0) return diff;
        return new Date(b.created_at) - new Date(a.created_at);
      });
    } else {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return { incidents: paginated, total, page, limit };
  },

  /**
   * Get single incident by UUID or reference_id
   */
  async getIncidentById(id) {
    if (isConnected && supabase) {
      try {
        const { data, error } = await supabase
          .from('incidents')
          .select('*, logs:incident_logs(*)')
          .or(`id.eq.${id},reference_id.eq.${id}`)
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('[CivicShield] Supabase getIncidentById fallback:', err.message);
      }
    }

    return memoryIncidents.find(i => i.id === id || i.reference_id === id) || null;
  },

  /**
   * Get single incident by reference_id (e.g. CS-2026-1001)
   */
  async getIncidentByReferenceId(referenceId) {
    return this.getIncidentById(referenceId);
  },

  /**
   * Get aggregate statistics for public dashboard
   */
  async getDashboardStats() {
    let incidents = memoryIncidents;
    if (isConnected && supabase) {
      try {
        const { data, error } = await supabase.from('incidents').select('status, urgency, category');
        if (!error && data) incidents = data;
      } catch (err) {
        console.warn('[CivicShield] Supabase stats fallback:', err.message);
      }
    }

    const total = incidents.length;
    const critical = incidents.filter(i => i.urgency === 'Critical' && i.status !== 'Resolved' && i.status !== 'Rejected').length;
    const inProgress = incidents.filter(i => ['Acknowledged', 'Dispatched', 'On Site'].includes(i.status)).length;
    const resolved = incidents.filter(i => i.status === 'Resolved').length;

    // Category distribution
    const categoryCounts = {};
    for (const cat of VALID_CATEGORIES) {
      categoryCounts[cat] = incidents.filter(i => i.category === cat).length;
    }

    return {
      total,
      critical,
      inProgress,
      resolved,
      categoryCounts
    };
  },

  /**
   * Submit new incident with duplicate check and unique reference_id
   */
  async createIncident(reportData) {
    // 1. Run Duplicate Incident Detection against existing non-resolved items
    const existingIncidents = isConnected && supabase
      ? (await supabase.from('incidents').select('*').in('status', ['Submitted', 'Acknowledged', 'Dispatched', 'On Site'])).data || memoryIncidents
      : memoryIncidents;

    const duplicateCheck = detectDuplicateIncident(existingIncidents, reportData);
    if (duplicateCheck.isDuplicate) {
      return {
        isDuplicate: true,
        reason: duplicateCheck.reason,
        existingIncident: duplicateCheck.existingIncident
      };
    }

    // 2. Build new incident record
    const reference_id = generateReferenceId();
    const now = new Date().toISOString();

    // Fields that are safe for Supabase insert (matches the DB schema exactly)
    // NOTE: Do NOT include `id` — let Supabase auto-generate the UUID.
    // NOTE: Do NOT include `logs` — that's a virtual join, not a real column.
    const supabaseRecord = {
      reference_id,
      title: reportData.title.trim(),
      description: reportData.description.trim(),
      category: reportData.category,
      urgency: reportData.urgency || 'Medium',
      landmark: reportData.landmark.trim(),
      area: reportData.area.trim(),
      latitude: reportData.latitude ? Number(reportData.latitude) : null,
      longitude: reportData.longitude ? Number(reportData.longitude) : null,
      photo_url: reportData.photo_url || null,
      status: 'Submitted',
      reporter_contact: reportData.reporter_contact || null,
      is_demo: false,
      created_at: now,
      updated_at: now,
      resolved_at: null
    };

    if (isConnected && supabase) {
      try {
        const { data, error } = await supabase
          .from('incidents')
          .insert([supabaseRecord])
          .select()
          .single();

        if (error) {
          console.error('[CivicShield] Supabase INSERT error:', error.message, error.details, error.hint);
        }

        if (!error && data) {
          // Log initial submission in the audit trail table
          await supabase.from('incident_logs').insert([{
            incident_id: data.id,
            actor_name: 'Citizen Reporter',
            previous_status: null,
            new_status: 'Submitted',
            notes: 'Citizen submitted report via CivicShield portal.'
          }]);
          console.log('[CivicShield] ✅ Incident saved to Supabase:', data.reference_id, data.id);
          return { isDuplicate: false, incident: data };
        }
      } catch (err) {
        console.error('[CivicShield] Supabase insert exception:', err.message);
      }
    }

    // Fallback: store in memory (offline / demo mode)
    const memoryRecord = {
      id: `inc-${Date.now()}`,
      ...supabaseRecord,
      assigned_crew_id: null,
      assigned_crew_name: null,
      verification_notes: null,
      resolution_notes: null,
      resolution_photo_url: null,
      logs: [
        {
          id: `log-${Date.now()}`,
          actor_name: 'Citizen Reporter',
          previous_status: null,
          new_status: 'Submitted',
          notes: 'Citizen submitted report via CivicShield portal.',
          created_at: now
        }
      ]
    };
    memoryIncidents.unshift(memoryRecord);
    return { isDuplicate: false, incident: memoryRecord };
  },

  /**
   * Update incident status with transition check and audit log
   */
  async updateStatus(id, newStatus, actorName = 'Dispatcher', notes = '') {
    const incident = await this.getIncidentById(id);
    if (!incident) {
      throw new Error(`Incident with ID '${id}' not found`);
    }

    if (!VALID_STATUSES.includes(newStatus)) {
      throw new Error(`Invalid status '${newStatus}'`);
    }

    const currentStatus = incident.status;
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus) && currentStatus !== newStatus) {
      throw new Error(`Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed: ${allowed.join(', ') || 'None'}`);
    }

    const now = new Date().toISOString();
    const resolved_at = newStatus === 'Resolved' ? now : incident.resolved_at;

    const logEntry = {
      incident_id: incident.id,
      actor_name: actorName,
      previous_status: currentStatus,
      new_status: newStatus,
      notes: notes || `Status updated from ${currentStatus} to ${newStatus}`,
      created_at: now
    };

    if (isConnected && supabase) {
      try {
        await supabase
          .from('incidents')
          .update({ status: newStatus, updated_at: now, resolved_at })
          .eq('id', incident.id);
        await supabase.from('incident_logs').insert([logEntry]);
      } catch (err) {
        console.warn('[CivicShield] Supabase status update error:', err.message);
      }
    }

    incident.status = newStatus;
    incident.updated_at = now;
    incident.resolved_at = resolved_at;
    if (!incident.logs) incident.logs = [];
    incident.logs.unshift({ id: `log-${Date.now()}`, ...logEntry });

    return incident;
  },

  /**
   * Assign incident to field crew
   */
  async assignCrew(id, crewId, actorName = 'Dispatcher') {
    const incident = await this.getIncidentById(id);
    if (!incident) throw new Error('Incident not found');

    const staffMember = memoryStaff.find(s => s.id === crewId);
    const crewName = staffMember ? `${staffMember.full_name} (${staffMember.badge_number || 'Crew'})` : 'Assigned Field Crew';

    const now = new Date().toISOString();
    const newStatus = (incident.status === 'Submitted' || incident.status === 'Acknowledged') ? 'Dispatched' : incident.status;

    const logEntry = {
      incident_id: incident.id,
      actor_name: actorName,
      previous_status: incident.status,
      new_status: newStatus,
      notes: `Assigned to field crew: ${crewName}`,
      created_at: now
    };

    if (isConnected && supabase) {
      try {
        await supabase
          .from('incidents')
          .update({
            assigned_crew_name: crewName,
            status: newStatus,
            updated_at: now
          })
          .eq('id', incident.id);
        await supabase.from('incident_logs').insert([logEntry]);
      } catch (err) {
        console.warn('[CivicShield] Supabase assignCrew error:', err.message);
      }
    }

    incident.assigned_crew_id = crewId;
    incident.assigned_crew_name = crewName;
    incident.status = newStatus;
    incident.updated_at = now;
    if (!incident.logs) incident.logs = [];
    incident.logs.unshift({ id: `log-${Date.now()}`, ...logEntry });

    return incident;
  },

  /**
   * Record On-Site Verification
   */
  async recordVerification(id, { notes, actorName = 'Field Crew Tech' }) {
    const incident = await this.getIncidentById(id);
    if (!incident) throw new Error('Incident not found');

    const now = new Date().toISOString();
    const newStatus = incident.status === 'Dispatched' ? 'On Site' : incident.status;

    const logEntry = {
      incident_id: incident.id,
      actor_name: actorName,
      previous_status: incident.status,
      new_status: newStatus,
      notes: `On-Site Verification: ${notes}`,
      created_at: now
    };

    if (isConnected && supabase) {
      try {
        await supabase
          .from('incidents')
          .update({
            verification_notes: notes,
            status: newStatus,
            updated_at: now
          })
          .eq('id', incident.id);
        await supabase.from('incident_logs').insert([logEntry]);
      } catch (err) {
        console.warn('[CivicShield] Supabase verification error:', err.message);
      }
    }

    incident.verification_notes = notes;
    incident.status = newStatus;
    incident.updated_at = now;
    if (!incident.logs) incident.logs = [];
    incident.logs.unshift({ id: `log-${Date.now()}`, ...logEntry });

    return incident;
  },

  /**
   * Record Resolution
   */
  async recordResolution(id, { notes, photo_url, actorName = 'Field Crew Tech' }) {
    const incident = await this.getIncidentById(id);
    if (!incident) throw new Error('Incident not found');

    const now = new Date().toISOString();

    const logEntry = {
      incident_id: incident.id,
      actor_name: actorName,
      previous_status: incident.status,
      new_status: 'Resolved',
      notes: `Incident Resolved: ${notes}`,
      created_at: now
    };

    if (isConnected && supabase) {
      try {
        await supabase
          .from('incidents')
          .update({
            resolution_notes: notes,
            resolution_photo_url: photo_url || null,
            status: 'Resolved',
            resolved_at: now,
            updated_at: now
          })
          .eq('id', incident.id);
        await supabase.from('incident_logs').insert([logEntry]);
      } catch (err) {
        console.warn('[CivicShield] Supabase resolution error:', err.message);
      }
    }

    incident.resolution_notes = notes;
    if (photo_url) incident.resolution_photo_url = photo_url;
    incident.status = 'Resolved';
    incident.updated_at = now;
    incident.resolved_at = now;
    if (!incident.logs) incident.logs = [];
    incident.logs.unshift({ id: `log-${Date.now()}`, ...logEntry });

    return incident;
  },

  /**
   * Get staff directory for crew assignment dropdown
   */
  async getStaff() {
    return memoryStaff;
  }
};
