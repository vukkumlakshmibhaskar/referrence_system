'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hasPermission, hasAnyPermission, hasAllPermissions, PERMISSIONS } from './permissions';

// Hook to check permissions in components
export function usePermission(requiredPermission) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    if (!token || !storedUser.role) {
      router.push('/login');
      return;
    }

    setUser(storedUser);
    setLoading(false);
  }, [router]);

  const hasAccess = user ? hasPermission(user.role, requiredPermission) : false;

  return { user, loading, hasAccess, PERMISSIONS };
}

// Hook to check multiple permissions (any)
export function useAnyPermission(requiredPermissions) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    if (!token || !storedUser.role) {
      router.push('/login');
      return;
    }

    setUser(storedUser);
    setLoading(false);
  }, [router]);

  const hasAccess = user ? hasAnyPermission(user.role, requiredPermissions) : false;

  return { user, loading, hasAccess, PERMISSIONS };
}

// Higher-order component wrapper for protected routes
export function withPermission(Component, requiredPermission) {
  return function ProtectedComponent(props) {
    const { user, loading, hasAccess } = usePermission(requiredPermission);

    if (loading) {
      return null; // Or a loading spinner
    }

    if (!hasAccess) {
      return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
        </div>
      );
    }

    return <Component {...props} user={user} />;
  };
}

export { PERMISSIONS, hasPermission, hasAnyPermission, hasAllPermissions };