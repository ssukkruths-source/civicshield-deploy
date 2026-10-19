const API_BASE = '/api';

/**
 * Fetch with JSON headers and staff session credentials
 */
async function request(endpoint, options = {}) {
  const sessionToken = localStorage.getItem('civicshield_session_token');
  const staffRole = localStorage.getItem('civicshield_staff_role') || 'citizen';
  const staffId = localStorage.getItem('civicshield_staff_id') || '';

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
    if (staffRole && staffRole !== 'citizen') {
      headers['X-Staff-Role'] = staffRole;
      headers['X-Staff-Id'] = staffId;
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Authentication
  login: ({ identifier, password, expectedRole }) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password, expectedRole }),
    }),

  getMe: () => request('/auth/me'),

  logout: () =>
    request('/auth/logout', {
      method: 'POST',
    }),

  // Health
  getHealth: () => request('/health'),

  // Stats
  getStats: () => request('/dashboard/stats'),

  // Incidents
  getIncidents: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const qs = query.toString();
    return request(`/incidents${qs ? `?${qs}` : ''}`);
  },

  getIncidentById: (id) => request(`/incidents/${id}`),

  getIncidentByReference: (referenceId) => request(`/incidents/reference/${encodeURIComponent(referenceId)}`),

  createIncident: (reportData) =>
    request('/incidents', {
      method: 'POST',
      body: JSON.stringify(reportData),
    }),

  // Protected staff operations
  updateStatus: (id, status, notes = '') =>
    request(`/incidents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    }),

  assignCrew: (id, crewId) =>
    request(`/incidents/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ crewId }),
    }),

  recordVerification: (id, notes) =>
    request(`/incidents/${id}/verification`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),

  recordResolution: (id, { notes, photo_url }) =>
    request(`/incidents/${id}/resolution`, {
      method: 'POST',
      body: JSON.stringify({ notes, photo_url }),
    }),

  getStaffDirectory: () => request('/staff'),
};
