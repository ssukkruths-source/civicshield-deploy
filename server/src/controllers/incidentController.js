import { incidentService } from '../services/incidentService.js';

export const incidentController = {
  // GET /api/incidents
  async getIncidents(req, res, next) {
    try {
      const { search, category, urgency, status, area, sort, page, limit } = req.query;
      const result = await incidentService.getIncidents({
        search,
        category,
        urgency,
        status,
        area,
        sort,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20
      });

      res.json({
        success: true,
        data: result.incidents,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit) || 1
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/incidents/:id
  async getIncidentById(req, res, next) {
    try {
      const { id } = req.params;
      const incident = await incidentService.getIncidentById(id);
      if (!incident) {
        return res.status(404).json({
          success: false,
          error: `Incident '${id}' not found`
        });
      }
      res.json({ success: true, data: incident });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/incidents/reference/:referenceId
  async getIncidentByReference(req, res, next) {
    try {
      const { referenceId } = req.params;
      const incident = await incidentService.getIncidentByReferenceId(referenceId);
      if (!incident) {
        return res.status(404).json({
          success: false,
          error: `No hazard incident found with reference ID '${referenceId}'`
        });
      }
      res.json({ success: true, data: incident });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/incidents
  async createIncident(req, res, next) {
    try {
      const result = await incidentService.createIncident(req.body);

      // Handle duplicate detection prompt
      if (result.isDuplicate) {
        return res.status(409).json({
          success: false,
          isDuplicate: true,
          message: 'Potential duplicate hazard report detected.',
          reason: result.reason,
          existingIncident: result.existingIncident,
          hint: 'You may view the existing report or submit with forceSubmit: true if this is a separate occurrence.'
        });
      }

      res.status(201).json({
        success: true,
        message: 'Hazard incident successfully reported and queued for municipal dispatch.',
        data: result.incident
      });
    } catch (err) {
      next(err);
    }
  },

  // PATCH /api/incidents/:id/status
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const actorName = req.staffUser?.name || 'Municipal Staff';

      if (!status) {
        return res.status(400).json({ success: false, error: 'Status is required' });
      }

      const updated = await incidentService.updateStatus(id, status, actorName, notes);
      res.json({
        success: true,
        message: `Incident status updated to '${status}'`,
        data: updated
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // PATCH /api/incidents/:id/assign
  async assignCrew(req, res, next) {
    try {
      const { id } = req.params;
      const { crewId } = req.body;
      const actorName = req.staffUser?.name || 'Dispatcher';

      if (!crewId) {
        return res.status(400).json({ success: false, error: 'crewId is required' });
      }

      const updated = await incidentService.assignCrew(id, crewId, actorName);
      res.json({
        success: true,
        message: 'Field crew assigned and incident marked Dispatched.',
        data: updated
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // POST /api/incidents/:id/verification
  async recordVerification(req, res, next) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const actorName = req.staffUser?.name || 'Field Crew Tech';

      if (!notes || notes.trim().length < 3) {
        return res.status(400).json({ success: false, error: 'Verification notes are required' });
      }

      const updated = await incidentService.recordVerification(id, { notes, actorName });
      res.json({
        success: true,
        message: 'On-site verification notes recorded.',
        data: updated
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // POST /api/incidents/:id/resolution
  async recordResolution(req, res, next) {
    try {
      const { id } = req.params;
      const { notes, photo_url } = req.body;
      const actorName = req.staffUser?.name || 'Field Crew Tech';

      if (!notes || notes.trim().length < 5) {
        return res.status(400).json({ success: false, error: 'Resolution notes are required (at least 5 characters)' });
      }

      const updated = await incidentService.recordResolution(id, { notes, photo_url, actorName });
      res.json({
        success: true,
        message: 'Incident marked Resolved with completion notes.',
        data: updated
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // GET /api/dashboard/stats
  async getDashboardStats(req, res, next) {
    try {
      const stats = await incidentService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/staff
  async getStaffDirectory(req, res, next) {
    try {
      const staff = await incidentService.getStaff();
      res.json({ success: true, data: staff });
    } catch (err) {
      next(err);
    }
  }
};
