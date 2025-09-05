// Frontend/src/ProtectedRoute.tsx - Enhanced version for multiple concurrent sessions

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useEffect, useState } from 'react';
import { isImpersonationActive } from '@/utils/impersonation';

interface ProtectedRouteProps {
  allowedRoles: string[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { activeRole, switchRole } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const location = useLocation();

  // Get role-specific tokens
  const adminToken = localStorage.getItem('adminToken');
  const clientToken = localStorage.getItem('clientToken');
  const superadminToken = localStorage.getItem('superadminToken');
  const agentToken = localStorage.getItem('agentToken');

  // Determine expected role based on current path
  const getExpectedRoleFromPath = (pathname: string): string | null => {
    if (pathname.startsWith('/client')) return 'client';
    if (pathname.startsWith('/admin')) return 'admin';
    if (pathname.startsWith('/agent')) return 'agent';
    if (pathname.startsWith('/superadmin')) return 'superadmin';
    return null;
  };

  // Check if specific role token exists and is valid
  const hasValidTokenForRole = (role: string): boolean => {
    const token = localStorage.getItem(`${role}Token`);
    const user = localStorage.getItem(`${role}User`);
    return !!(token && user);
  };

  useEffect(() => {
    // Check if impersonation is active
    const impersonationActive = isImpersonationActive();

    // Determine expected role based on current path
    const pathBasedRole = getExpectedRoleFromPath(location.pathname);

    let targetRole: string | null = null;

    if (pathBasedRole) {
      // If impersonation is active and we're on admin/superadmin path, don't switch to client
      if (impersonationActive && (pathBasedRole === 'admin' || pathBasedRole === 'superadmin')) {
        // Check if we have valid token for the path-based role (admin/superadmin)
        if (hasValidTokenForRole(pathBasedRole) && allowedRoles.includes(pathBasedRole)) {
          targetRole = pathBasedRole;
        }
      } else if (!impersonationActive && pathBasedRole === 'client') {
        // Normal client access when not impersonating
        if (hasValidTokenForRole(pathBasedRole) && allowedRoles.includes(pathBasedRole)) {
          targetRole = pathBasedRole;
        }
      } else if (pathBasedRole !== 'client') {
        // For non-client paths, proceed normally
        if (hasValidTokenForRole(pathBasedRole) && allowedRoles.includes(pathBasedRole)) {
          targetRole = pathBasedRole;
        }
      }
    } else {
      // Fallback logic remains the same
      if (allowedRoles.includes('superadmin') && superadminToken) {
        targetRole = 'superadmin';
      } else if (allowedRoles.includes('admin') && adminToken) {
        targetRole = 'admin';
      } else if (allowedRoles.includes('agent') && agentToken) {
        targetRole = 'agent';
      } else if (allowedRoles.includes('client') && clientToken) {
        targetRole = 'client';
      }
    }

    // Only switch role if we have a valid target role and it's different from current
    if (targetRole && activeRole !== targetRole) {
      switchRole(targetRole, undefined);
    }

    setIsInitialized(true);
  }, [activeRole, allowedRoles, adminToken, clientToken, superadminToken, agentToken, switchRole, location.pathname]);

  // useEffect(() => {
  //   // Determine expected role based on current path
  //   const pathBasedRole = getExpectedRoleFromPath(location.pathname);

  //   let targetRole: string | null = null;

  //   if (pathBasedRole) {
  //     // If path suggests a specific role, check if we have valid token for it
  //     if (hasValidTokenForRole(pathBasedRole) && allowedRoles.includes(pathBasedRole)) {
  //       targetRole = pathBasedRole;
  //     }
  //   } else {
  //     // Fallback to priority order if no path-based role detected
  //     if (allowedRoles.includes('superadmin') && superadminToken) {
  //       targetRole = 'superadmin';
  //     } else if (allowedRoles.includes('admin') && adminToken) {
  //       targetRole = 'admin';
  //     } else if (allowedRoles.includes('agent') && agentToken) {
  //       targetRole = 'agent';
  //     } else if (allowedRoles.includes('client') && clientToken) {
  //       targetRole = 'client';
  //     }
  //   }

  //   // Only switch role if we have a valid target role and it's different from current
  //   if (targetRole && activeRole !== targetRole) {
  //     // Don't navigate on role switch - maintain current URL
  //     switchRole(targetRole, undefined);
  //   }

  //   setIsInitialized(true);
  // }, [activeRole, allowedRoles, adminToken, clientToken, superadminToken, agentToken, switchRole, location.pathname]);

  // Don't render anything until we've determined the correct role
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Get user based on current activeRole
  const userString = activeRole ? localStorage.getItem(`${activeRole}User`) : null;
  const user = userString ? JSON.parse(userString) : null;
  const userRole = user?.role || '';
  const isAuthenticated = !!user;

  // Check if user role is allowed for this route
  const isAuthorized = allowedRoles.includes(userRole);

  // Enhanced authentication check
  if (!isAuthenticated) {
    const pathBasedRole = getExpectedRoleFromPath(location.pathname);

    if (pathBasedRole) {
      // Redirect to the appropriate login for the path
      const loginPath = pathBasedRole === 'client' ? '/login' : `/login/${pathBasedRole}`;
      return <Navigate to={loginPath} replace />;
    }

    // Default fallback
    return <Navigate to="/login" replace />;
  }

  // Enhanced authorization check
  if (!isAuthorized) {
    const pathBasedRole = getExpectedRoleFromPath(location.pathname);

    // If user is trying to access a specific role path but doesn't have permission
    if (pathBasedRole && !allowedRoles.includes(userRole)) {
      // Check if user has token for other roles and redirect appropriately
      if (hasValidTokenForRole('superadmin') && userRole === 'superadmin') {
        return <Navigate to="/superadmin/configure" replace />;
      } else if (hasValidTokenForRole('admin') && userRole === 'admin') {
        return <Navigate to="/admin/dashboard" replace />;
      } else if (hasValidTokenForRole('agent') && userRole === 'agent') {
        return <Navigate to="/agent/dashboard" replace />;
      } else if (hasValidTokenForRole('client') && userRole === 'client') {
        return <Navigate to="/client/dashboard" replace />;
      }
    }

    // Default role-based redirection
    if (userRole === 'superadmin' && hasValidTokenForRole('superadmin')) {
      return <Navigate to="/superadmin/configure" replace />;
    } else if (userRole === 'admin' && hasValidTokenForRole('admin')) {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userRole === 'agent' && hasValidTokenForRole('agent')) {
      return <Navigate to="/agent/dashboard" replace />;
    } else if (userRole === 'client' && hasValidTokenForRole('client')) {
      return <Navigate to="/client/dashboard" replace />;
    }

    // Fallback to appropriate login
    const loginPath = userRole === 'client' ? '/login' : `/login/${userRole}`;
    return <Navigate to={loginPath} replace />;
  }

  // Render the protected route
  return <Outlet />;
};

export default ProtectedRoute;