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

    // 1. Bearer Token Verification (CivicShield Staff Session or Supabase Auth)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      // Handle CivicShield Session Token (cs_auth_{staffId}_{timestamp})
      if (token.startsWith('cs_auth_')) {
        const parts = token.split('_');
        const staffId = parts[2] === 'admin' ? 'staff-admin' : `${parts[2]}_${parts[3]}`.startsWith('staff-') ? `${parts[2]}_${parts[3]}` : parts[2];
        // Alternatively find staff where token matches or staff.id is present in token
        const staffMember = INITIAL_STAFF.find(s => token.includes(`_${s.id}_`) || s.id === staffId) || INITIAL_STAFF.find(s => s.role === 'dispatcher');

        if (staffMember) {
          if (!allowedRoles.includes(staffMember.role) && staffMember.role !== 'admin') {
            return res.status(403).json({
              success: false,
              error: `Access denied. Role '${staffMember.role}' is not authorized for this action.`
            });
          }

          req.staffUser = {
            id: staffMember.id,
            email: staffMember.email,
            role: staffMember.role,
            name: staffMember.full_name,
            badge_number: staffMember.badge_number,
            department: staffMember.department
          };
          return next();
        }
      }

      // Supabase Auth verification if configured
      if (isConnected && supabase) {
        try {
          const { data: { user }, error } = await supabase.auth.getUser(token);
          if (error || !user) {
            return res.status(401).json({
              success: false,
              error: 'Invalid or expired staff authentication token.'
            });
          }

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
