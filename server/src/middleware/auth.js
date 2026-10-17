import { supabase, isConnected } from '../config/supabase.js';
import { INITIAL_STAFF } from '../data/seedData.js';

/**
 * Authentication & Role Middleware
 * Validates either:
 * 1. Supabase Auth JWT token in Authorization: Bearer <token>
 * 2. Or Demo Staff session headers (for hackathon evaluation)
 */
export function requireStaffRole(allowedRoles = ['admin', 'dispatcher', 'field_crew']) {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const demoRoleHeader = req.headers['x-staff-role'];
    const demoStaffId = req.headers['x-staff-id'];

    // 1. Supabase Auth verification
    if (authHeader && authHeader.startsWith('Bearer ') && isConnected && supabase) {
      const token = authHeader.split(' ')[1];
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
          return res.status(401).json({
            success: false,
            error: 'Invalid or expired staff authentication token.'
          });
        }

        // Fetch user profile role from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        const userRole = profile?.role || 'field_crew';
        if (!allowedRoles.includes(userRole) && userRole !== 'admin') {
          return res.status(403).json({
            success: false,
            error: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}], but your role is '${userRole}'.`
          });
        }

        req.staffUser = {
          id: user.id,
          email: user.email,
          role: userRole,
          name: profile?.full_name || user.email
        };
        return next();
      } catch (err) {
        return res.status(401).json({ success: false, error: 'Authentication verification failure.' });
      }
    }

    // 2. Demo/Hackathon Evaluation Access Header
    if (demoRoleHeader) {
      const normalizedRole = demoRoleHeader.toLowerCase();
      if (!allowedRoles.includes(normalizedRole) && normalizedRole !== 'admin') {
        return res.status(403).json({
          success: false,
          error: `Access denied. Demo role '${demoRoleHeader}' does not have sufficient permissions for this operation.`
        });
      }

      const staffMember = INITIAL_STAFF.find(s => s.role === normalizedRole || s.id === demoStaffId) || INITIAL_STAFF[0];
      req.staffUser = {
        id: staffMember.id,
        email: staffMember.email,
        role: normalizedRole,
        name: staffMember.full_name
      };
      return next();
    }

    // No authorization credentials provided
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Municipal staff credentials required for this dispatcher action.'
    });
  };
}
