// Frontend/src/hooks/useAuth.tsx - Enhanced for multiple concurrent sessions

import { useState, useEffect, createContext, useContext } from 'react';
import { NavigateFunction } from 'react-router-dom';
import { isImpersonationActive, getImpersonationInfo, endImpersonation as endImpersonationUtil } from '@/utils/impersonation';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface User {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    role: 'superadmin' | 'admin' | 'agent' | 'client';
    isEmailVerified: boolean;
}

interface AuthContextType {
    user: User | null;
    adminUser: User | null;
    agentUser: User | null;
    clientUser: User | null;
    superadminUser: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isImpersonated: boolean;
    activeRole: 'client' | 'admin' | 'agent' | 'superadmin' | null;
    impersonationInfo: any;
    login: (email: string, password: string, navigate: NavigateFunction) => Promise<void>;
    logout: (role?: string, navigate?: NavigateFunction) => void;
    switchRole: (role: string, navigate?: NavigateFunction) => void;
    endImpersonation: (navigate?: NavigateFunction) => void;
    hasMultipleRoles: () => boolean;
    getToken: (userType: 'client' | 'admin' | 'agent' | 'superadmin') => string | null;
    // Additional methods for concurrent session management
    getRoleFromPath: (pathname: string) => string | null;
    hasValidSession: (role: string) => boolean;
    getAllActiveSessions: () => string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProviderComponent({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [adminUser, setAdminUser] = useState<User | null>(null);
    const [agentUser, setAgentUser] = useState<User | null>(null);
    const [clientUser, setClientUser] = useState<User | null>(null);
    const [superadminUser, setSuperadminUser] = useState<User | null>(null);
    const [activeRole, setActiveRole] = useState<'client' | 'admin' | 'agent' | 'superadmin' | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isImpersonated, setIsImpersonated] = useState(false);
    const [impersonationInfo, setImpersonationInfo] = useState<{ clientName: string; clientEmail: any; adminName: string } | null>(null);

    // Get role from URL path
    const getRoleFromPath = (pathname: string): string | null => {
        if (pathname.startsWith('/client')) return 'client';
        if (pathname.startsWith('/admin')) return 'admin';
        if (pathname.startsWith('/agent')) return 'agent';
        if (pathname.startsWith('/superadmin')) return 'superadmin';
        return null;
    };

    // Check if a specific role has a valid session
    const hasValidSession = (role: string): boolean => {
        const token = localStorage.getItem(`${role}Token`);
        const user = localStorage.getItem(`${role}User`);
        return !!(token && user);
    };

    // Get all active sessions
    const getAllActiveSessions = (): string[] => {
        const sessions: string[] = [];
        ['client', 'admin', 'agent', 'superadmin'].forEach(role => {
            if (hasValidSession(role)) {
                sessions.push(role);
            }
        });
        return sessions;
    };

    // Get token based on user type
    const getToken = (userType: 'client' | 'admin' | 'agent' | 'superadmin'): string | null => {
        if (userType === 'superadmin') {
            return localStorage.getItem('superadminToken');
        } else if (userType === 'admin') {
            return localStorage.getItem('adminToken') || localStorage.getItem('superadminToken');
        } else if (userType === 'agent') {
            return localStorage.getItem('agentToken') || localStorage.getItem('adminToken') || localStorage.getItem('superadminToken');
        } else {
            return localStorage.getItem('clientToken');
        }
    };

    // Enhanced initialization
    useEffect(() => {
        const checkAuth = async () => {
            setIsLoading(true);

            try {
                // Load all possible user roles from localStorage
                const adminToken = localStorage.getItem('adminToken');
                const clientToken = localStorage.getItem('clientToken');
                const superadminToken = localStorage.getItem('superadminToken');
                const agentToken = localStorage.getItem('agentToken');

                const adminUserStr = localStorage.getItem('adminUser');
                const clientUserStr = localStorage.getItem('clientUser');
                const superadminUserStr = localStorage.getItem('superadminUser');
                const agentUserStr = localStorage.getItem('agentUser');

                // Set all available user objects
                if (adminUserStr) setAdminUser(JSON.parse(adminUserStr));
                if (clientUserStr) setClientUser(JSON.parse(clientUserStr));
                if (superadminUserStr) setSuperadminUser(JSON.parse(superadminUserStr));
                if (agentUserStr) setAgentUser(JSON.parse(agentUserStr));

                // Check if impersonation is active
                if (isImpersonationActive() && clientToken && clientUserStr) {
                    const clientUser = JSON.parse(clientUserStr);
                    setUser(clientUser);
                    setIsAuthenticated(true);
                    setIsImpersonated(true);
                    setImpersonationInfo(getImpersonationInfo());

                    // During impersonation, set role based on current path
                    const currentPath = window.location.pathname;
                    const pathBasedRole = getRoleFromPath(currentPath);

                    // If on admin/superadmin path during impersonation, maintain that role context
                    if ((pathBasedRole === 'admin' || pathBasedRole === 'superadmin') &&
                        (hasValidSession('admin') || hasValidSession('superadmin'))) {
                        setActiveRole(pathBasedRole as 'admin' | 'superadmin');
                    } else {
                        setActiveRole('client');
                    }

                    setIsLoading(false);
                    return;
                }

                // Enhanced role detection based on current URL
                const currentPath = window.location.pathname;
                const pathBasedRole = getRoleFromPath(currentPath);

                let targetRole: string | null = null;

                // First, try to use path-based role if valid
                if (pathBasedRole && hasValidSession(pathBasedRole)) {
                    targetRole = pathBasedRole;
                } else {
                    // Fallback to priority order
                    if (superadminToken && superadminUserStr) {
                        targetRole = 'superadmin';
                    } else if (adminToken && adminUserStr) {
                        targetRole = 'admin';
                    } else if (agentToken && agentUserStr) {
                        targetRole = 'agent';
                    } else if (clientToken && clientUserStr) {
                        targetRole = 'client';
                    }
                }

                if (targetRole) {
                    const userData = JSON.parse(localStorage.getItem(`${targetRole}User`) || '{}');
                    setUser(userData);
                    setActiveRole(targetRole as 'superadmin' | 'admin' | 'agent' | 'client');
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.error('Authentication error:', error);
                setUser(null);
                setActiveRole(null);
                setIsAuthenticated(false);
            }

            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const hasMultipleRoles = () => {
        return getAllActiveSessions().length > 1;
    };

    // Enhanced role switching - supports concurrent sessions
    const switchRole = (role: string, navigate?: NavigateFunction) => {
        if (!['admin', 'client', 'superadmin', 'agent'].includes(role)) {
            console.error('Invalid role specified');
            return;
        }

        if (!hasValidSession(role)) {
            console.error(`No valid session found for ${role}`);
            return;
        }

        const userData = JSON.parse(localStorage.getItem(`${role}User`) || '{}');
        const token = localStorage.getItem(`${role}Token`);

        setUser(userData);
        setActiveRole(role as 'superadmin' | 'admin' | 'agent' | 'client');
        setIsAuthenticated(true);

        // Update axios default headers for the current session
        const api = axios.create({ baseURL: API_URL });
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Only navigate if explicitly requested and path doesn't match role
        if (navigate) {
            const currentPath = window.location.pathname;
            const currentPathRole = getRoleFromPath(currentPath);

            // Only redirect if we're not already on the correct path
            if (currentPathRole !== role) {
                if (role === 'client') {
                    navigate('/client/dashboard');
                } else if (role === 'agent') {
                    navigate('/agent/dashboard');
                } else if (role === 'admin') {
                    navigate('/admin/dashboard');
                } else if (role === 'superadmin') {
                    navigate('/superadmin/configure');
                }
            }
        }
    };

    // Enhanced login - maintains existing sessions
    const login = async (email: string, password: string, navigate: NavigateFunction) => {
        try {
            const api = axios.create({ baseURL: API_URL });
            const response = await api.post('/api/auth/login', { email, password });

            if (response.data.success) {
                const { token, user } = response.data;
                const role = user.role;

                // Store auth data based on role
                localStorage.setItem(`${role}Token`, token);
                localStorage.setItem(`${role}User`, JSON.stringify(user));

                // Update role-specific user state
                if (role === 'admin') {
                    setAdminUser(user);
                } else if (role === 'superadmin') {
                    setSuperadminUser(user);
                } else if (role === 'agent') {
                    setAgentUser(user);
                } else if (role === 'client') {
                    setClientUser(user);
                }

                // Update active user state
                setUser(user);
                setActiveRole(role);
                setIsAuthenticated(true);

                // Set authorization header
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                // Redirect based on role
                if (role === 'admin' || role === 'superadmin') {
                    navigate('/admin/dashboard');
                } else if (role === 'agent') {
                    navigate('/agent/dashboard');
                } else {
                    navigate('/client/dashboard');
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    // Enhanced logout - maintains other sessions
    const logout = (role?: string, navigate?: NavigateFunction) => {
        if (role) {
            // Log out from specific role only
            localStorage.removeItem(`${role}Token`);
            localStorage.removeItem(`${role}User`);

            // Update state for that role
            if (role === 'admin') {
                setAdminUser(null);
            } else if (role === 'superadmin') {
                setSuperadminUser(null);
            } else if (role === 'agent') {
                setAgentUser(null);
            } else if (role === 'client') {
                setClientUser(null);
            }

            // If current active role is being logged out, switch to another available role
            if (activeRole === role) {
                const activeSessions = getAllActiveSessions().filter(r => r !== role);

                if (activeSessions.length > 0) {
                    // Switch to the highest priority available session
                    const priorityOrder = ['superadmin', 'admin', 'agent', 'client'];
                    const nextRole = priorityOrder.find(r => activeSessions.includes(r));

                    if (nextRole) {
                        switchRole(nextRole, navigate);
                        return;
                    }
                }

                // No other sessions available, do full logout
                logoutAll(navigate);
            }
        } else {
            // Full logout from all roles
            logoutAll(navigate);
        }
    };

    // Helper function to log out from all roles
    const logoutAll = (navigate?: NavigateFunction) => {
        // Clear all auth-related data
        const keysToRemove = [
            'token', 'user', 'adminToken', 'adminUser',
            'clientToken', 'clientUser', 'superadminToken', 'superadminUser',
            'agentToken', 'agentUser', 'isImpersonated'
        ];

        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Reset all auth state
        setUser(null);
        setAdminUser(null);
        setClientUser(null);
        setSuperadminUser(null);
        setAgentUser(null);
        setActiveRole(null);
        setIsAuthenticated(false);
        setIsImpersonated(false);
        setImpersonationInfo(null);

        // Clear API header
        const api = axios.create({ baseURL: API_URL });
        delete api.defaults.headers.common['Authorization'];

        // Redirect to login if navigate function is provided
        if (navigate) {
            navigate('/');
        }
    };

    const handleEndImpersonation = (navigate?: NavigateFunction) => {
        endImpersonationUtil();
        setIsImpersonated(false);
        setImpersonationInfo(null);

        if (localStorage.getItem('adminToken')) {
            switchRole('admin', navigate);
        } else if (localStorage.getItem('superadminToken')) {
            switchRole('superadmin', navigate);
        } else if (navigate) {
            navigate('/');
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                adminUser,
                agentUser,
                clientUser,
                superadminUser,
                isAuthenticated,
                isLoading,
                isImpersonated,
                activeRole,
                impersonationInfo,
                login,
                logout,
                switchRole,
                hasMultipleRoles,
                endImpersonation: handleEndImpersonation,
                getToken,
                // Additional methods for concurrent session management
                getRoleFromPath,
                hasValidSession,
                getAllActiveSessions
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

function useAuthHook() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export const AuthProvider = AuthProviderComponent;
export const useAuth = useAuthHook;