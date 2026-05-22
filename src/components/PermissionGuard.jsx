'use client';

import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export function PermissionGuard({ children, permission, fallback = null }) {
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const user = userStr ? JSON.parse(userStr) : null;

  if (!user) {
    return fallback;
  }

  const hasAccess = hasPermission(user.role, permission);

  if (!hasAccess) {
    return fallback;
  }

  return children;
}

export function RoleGuard({ children, roles, fallback = null }) {
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const user = userStr ? JSON.parse(userStr) : null;

  if (!user) {
    return fallback;
  }

  const userRoles = Array.isArray(roles) ? roles : [roles];

  if (!userRoles.includes(user.role)) {
    return fallback;
  }

  return children;
}

// Pre-built permission components
export function AdminOnly({ children, fallback = null }) {
  return (
    <RoleGuard roles="admin" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function PartnerOnly({ children, fallback = null }) {
  return (
    <RoleGuard roles="partner" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function StudentOnly({ children, fallback = null }) {
  return (
    <RoleGuard roles="student" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function CanCreateReferralCode({ children, fallback = null }) {
  return (
    <PermissionGuard permission={PERMISSIONS.CREATE_REFERRAL_CODE} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function CanCreatePartner({ children, fallback = null }) {
  return (
    <PermissionGuard permission={PERMISSIONS.CREATE_PARTNER} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function CanViewReferredStudents({ children, fallback = null }) {
  return (
    <PermissionGuard permission={PERMISSIONS.VIEW_REFERRED_STUDENTS} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export { PERMISSIONS };