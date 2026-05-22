// Role-based permissions configuration

export const ROLES = {
  ADMIN: 'admin',
  PARTNER: 'partner'
};

// Permission definitions
export const PERMISSIONS = {
  // Admin permissions
  ADMIN_ACCESS: 'admin:access',
  CREATE_PARTNER: 'admin:create_partner',
  CREATE_REFERRAL_CODE: 'admin:create_referral_code',
  VIEW_ALL_USERS: 'admin:view_all_users',
  VIEW_ALL_REFERRAL_CODES: 'admin:view_all_referral_codes',
  VIEW_ALL_STUDENTS: 'admin:view_all_students',
  VIEW_ALL_PARTNERS: 'admin:view_all_partners',
  DELETE_USER: 'admin:delete_user',
  TOGGLE_REFERRAL_CODE: 'admin:toggle_referral_code',
  DELETE_REFERRAL_CODE: 'admin:delete_referral_code',

  // Partner permissions
  PARTNER_ACCESS: 'partner:access',
  CREATE_REFERRAL_CODE: 'partner:create_referral_code',
  DELETE_REFERRAL_CODE: 'partner:delete_referral_code',
  VIEW_OWN_REFERRAL_CODE: 'partner:view_own_referral_code',
  VIEW_REFERRED_STUDENTS: 'partner:view_referred_students',
  COPY_REFERRAL_CODE: 'partner:copy_referral_code',
  MANAGE_JOB_POSTINGS: 'partner:manage_job_postings',
  VIEW_COLLABORATIONS: 'partner:view_collaborations',

  // Common permissions
  LOGIN: 'common:login',
  REGISTER: 'common:register',
  LOGOUT: 'common:logout'
};

// Role to permissions mapping
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.CREATE_PARTNER,
    PERMISSIONS.CREATE_REFERRAL_CODE,
    PERMISSIONS.VIEW_ALL_USERS,
    PERMISSIONS.VIEW_ALL_REFERRAL_CODES,
    PERMISSIONS.VIEW_ALL_STUDENTS,
    PERMISSIONS.VIEW_ALL_PARTNERS,
    PERMISSIONS.DELETE_USER,
    PERMISSIONS.TOGGLE_REFERRAL_CODE,
    PERMISSIONS.DELETE_REFERRAL_CODE,
    PERMISSIONS.LOGIN,
    PERMISSIONS.LOGOUT
  ],
  [ROLES.PARTNER]: [
    PERMISSIONS.PARTNER_ACCESS,
    PERMISSIONS.CREATE_REFERRAL_CODE,
    PERMISSIONS.DELETE_REFERRAL_CODE,
    PERMISSIONS.VIEW_OWN_REFERRAL_CODE,
    PERMISSIONS.VIEW_REFERRED_STUDENTS,
    PERMISSIONS.COPY_REFERRAL_CODE,
    PERMISSIONS.MANAGE_JOB_POSTINGS,
    PERMISSIONS.VIEW_COLLABORATIONS,
    PERMISSIONS.LOGIN,
    PERMISSIONS.LOGOUT
  ]
};

// Check if a role has a specific permission
export function hasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(permission) : false;
}

// Check if a role has any of the given permissions
export function hasAnyPermission(role, permissions) {
  return permissions.some(permission => hasPermission(role, permission));
}

// Check if a role has all of the given permissions
export function hasAllPermissions(role, permissions) {
  return permissions.every(permission => hasPermission(role, permission));
}

// Get all permissions for a role
export function getPermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}