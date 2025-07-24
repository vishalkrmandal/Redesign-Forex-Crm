// Frontend/src/ProtectedRoute.tsx - Updated version
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  allowedRoles: string[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { activeRole, switchRole } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  // Get role-specific tokens
  const adminToken = localStorage.getItem('adminToken');
  const clientToken = localStorage.getItem('clientToken');
  const superadminToken = localStorage.getItem('superadminToken');
  const agentToken = localStorage.getItem('agentToken');

  useEffect(() => {
    // Determine which role should be active based on available tokens
    let expectedRole: string | null = null;

    if (allowedRoles.includes('superadmin') && superadminToken) {
      expectedRole = 'superadmin';
    } else if (allowedRoles.includes('admin') && adminToken) {
      expectedRole = 'admin';
    } else if (allowedRoles.includes('agent') && agentToken) {
      expectedRole = 'agent';
    } else if (allowedRoles.includes('client') && clientToken) {
      expectedRole = 'client';
    }

    // Only switch role if we have a token but no active role, or wrong active role
    if (expectedRole && activeRole !== expectedRole) {
      // Don't navigate on role switch - let the current URL stay
      switchRole(expectedRole, undefined); // Pass undefined instead of navigate
    }

    setIsInitialized(true);
  }, [activeRole, allowedRoles, adminToken, clientToken, superadminToken, agentToken, switchRole]);

  // Don't render anything until we've determined the correct role
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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

  if (!isAuthenticated) {
    // Redirect to appropriate login based on which tokens are available
    if (superadminToken) {
      return <Navigate to="/login/superadmin" replace />;
    } else if (adminToken) {
      return <Navigate to="/login/admin" replace />;
    } else if (agentToken) {
      return <Navigate to="/login/agent" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  if (!isAuthorized) {
    // Redirect based on available roles - use specific dashboard routes
    // PRIORITY ORDER: superadmin > admin > agent > client
    if ((superadminToken) && (userRole === 'superadmin')) {
      return <Navigate to="/superadmin/configure" replace />;
    } else if ((adminToken) && (userRole === 'admin')) {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (agentToken && userRole === 'agent') {
      return <Navigate to="/agent/dashboard" replace />;
    } else if (clientToken && userRole === 'client') {
      return <Navigate to="/client/dashboard" replace />;
    } else {
      // No valid role found, go to appropriate login
      const loginPath = userRole === 'client' ? '/login' : `/login/${userRole}`;
      return <Navigate to={loginPath} replace />;
    }
  }

  // Render the protected route
  return <Outlet />;
};

export default ProtectedRoute;