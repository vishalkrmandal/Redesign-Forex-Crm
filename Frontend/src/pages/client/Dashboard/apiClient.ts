// Frontend/src/services/api/apiClient.ts - Enhanced for multiple concurrent sessions

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { toast } from 'sonner';

interface ApiError {
    success: false;
    message: string;
    error?: string;
}

interface ApiResponse<T = any> {
    partners: any;
    success: boolean;
    data?: T;
    message?: string;
}

declare module 'axios' {
    export interface AxiosRequestConfig {
        metadata?: {
            startTime: number;
        };
        // Add session context
        sessionContext?: {
            role: string;
            forceRole?: boolean;
        };
    }
}

class ApiClient {
    private client: AxiosInstance;
    private baseURL: string;

    constructor() {
        this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    private setupInterceptors() {
        // Enhanced request interceptor
        this.client.interceptors.request.use(
            (config) => {
                // Enhanced token selection based on context
                const token = this.getAuthTokenForRequest(config);
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }

                // Add request timestamp for debugging
                config.metadata = { startTime: Date.now() };

                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Enhanced response interceptor
        this.client.interceptors.response.use(
            (response: AxiosResponse) => {
                // Log response time in development
                if (import.meta.env.DEV && response.config.metadata) {
                    const duration = Date.now() - response.config.metadata.startTime;
                    console.log(`API ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
                }

                return response;
            },
            (error: AxiosError<ApiError>) => {
                this.handleApiError(error);
                return Promise.reject(error);
            }
        );
    }

    // Enhanced token selection logic
    private getAuthTokenForRequest(config: any): string | null {
        // If session context is provided, use that role's token
        if (config.sessionContext?.role) {
            return localStorage.getItem(`${config.sessionContext.role}Token`);
        }

        // Determine role from URL path
        const roleFromPath = this.getRoleFromUrl(config.url || '');
        if (roleFromPath) {
            const roleToken = localStorage.getItem(`${roleFromPath}Token`);
            if (roleToken) return roleToken;
        }

        // Fallback to current active role or priority order
        return this.getAuthToken();
    }

    // Extract role from API URL
    private getRoleFromUrl(url: string): string | null {
        if (url.includes('/api/client/') || url.includes('/client/')) return 'client';
        if (url.includes('/api/admin/') || url.includes('/admin/')) return 'admin';
        if (url.includes('/api/agent/') || url.includes('/agent/')) return 'agent';
        if (url.includes('/api/superadmin/') || url.includes('/superadmin/')) return 'superadmin';
        return null;
    }

    private getAuthToken(): string | null {
        // Enhanced token selection based on current page context
        const currentPath = window.location.pathname;

        // First, try to get token based on current path
        if (currentPath.startsWith('/client')) {
            return localStorage.getItem('clientToken');
        }
        if (currentPath.startsWith('/admin')) {
            return localStorage.getItem('adminToken') || localStorage.getItem('superadminToken');
        }
        if (currentPath.startsWith('/agent')) {
            return localStorage.getItem('agentToken') || localStorage.getItem('adminToken') || localStorage.getItem('superadminToken');
        }
        if (currentPath.startsWith('/superadmin')) {
            return localStorage.getItem('superadminToken');
        }

        // Fallback to priority order
        return localStorage.getItem('clientToken') ||
            localStorage.getItem('adminToken') ||
            localStorage.getItem('superadminToken') ||
            localStorage.getItem('agentToken');
    }

    private handleApiError(error: AxiosError<ApiError>) {
        let errorMessage = 'An unexpected error occurred';

        if (error.response) {
            const { status, data } = error.response;

            switch (status) {
                case 400:
                    errorMessage = data?.message || 'Bad request';
                    break;
                case 401:
                    errorMessage = 'Authentication required';
                    this.handleUnauthorized();
                    break;
                case 403:
                    errorMessage = 'Access forbidden';
                    break;
                case 404:
                    errorMessage = data?.message || 'Resource not found';
                    break;
                case 422:
                    errorMessage = data?.message || 'Validation error';
                    break;
                case 429:
                    errorMessage = data?.message || 'Too many requests. Please try again later.';
                    break;
                case 500:
                    errorMessage = data?.message || 'Internal server error';
                    break;
                case 503:
                    errorMessage = data?.message || 'Service unavailable';
                    break;
                default:
                    errorMessage = data?.message || `Error ${status}`;
            }
        } else if (error.request) {
            if (error.code === 'ECONNABORTED') {
                errorMessage = 'Request timeout. Please check your connection.';
            } else {
                errorMessage = 'Network error. Please check your connection.';
            }
        }

        // Show error toast (except for 401 which is handled separately)
        if (error.response?.status !== 401) {
            toast.error(errorMessage);
        }

        // Log error in development
        if (import.meta.env.DEV) {
            console.error('API Error:', {
                url: error.config?.url,
                method: error.config?.method,
                status: error.response?.status,
                message: errorMessage,
                data: error.response?.data
            });
        }
    }

    // Enhanced unauthorized handling - doesn't clear all sessions
    private handleUnauthorized() {
        const currentPath = window.location.pathname;
        const currentRole = this.getRoleFromPath(currentPath);

        if (currentRole) {
            // Only clear the current role's tokens
            localStorage.removeItem(`${currentRole}Token`);
            localStorage.removeItem(`${currentRole}User`);

            // Check if other sessions are available
            const availableRoles = ['client', 'admin', 'agent', 'superadmin']
                .filter(role => role !== currentRole)
                .filter(role => localStorage.getItem(`${role}Token`));

            if (availableRoles.length > 0) {
                // Redirect to an available session
                const redirectRole = availableRoles[0];
                const redirectPath = this.getDefaultPathForRole(redirectRole);
                window.location.href = redirectPath;
                toast.error(`${currentRole} session expired. Switched to ${redirectRole} session.`);
                return;
            }
        }

        // No other sessions available, full logout
        this.clearAllSessions();
        window.location.href = '/';
        toast.error('Session expired. Please login again.');
    }

    // Get role from current path
    private getRoleFromPath(path: string): string | null {
        if (path.startsWith('/client')) return 'client';
        if (path.startsWith('/admin')) return 'admin';
        if (path.startsWith('/agent')) return 'agent';
        if (path.startsWith('/superadmin')) return 'superadmin';
        return null;
    }

    // Get default path for role
    private getDefaultPathForRole(role: string): string {
        switch (role) {
            case 'client': return '/client/dashboard';
            case 'admin': return '/admin/dashboard';
            case 'agent': return '/agent/dashboard';
            case 'superadmin': return '/superadmin/configure';
            default: return '/';
        }
    }

    // Clear all sessions
    private clearAllSessions() {
        const keysToRemove = [
            'token', 'user', 'adminToken', 'adminUser',
            'clientToken', 'clientUser', 'superadminToken', 'superadminUser',
            'agentToken', 'agentUser', 'isImpersonated'
        ];

        keysToRemove.forEach(key => localStorage.removeItem(key));
    }

    // Enhanced HTTP Methods with session context support
    async get<T = any>(url: string, config?: any): Promise<AxiosResponse<ApiResponse<T>>> {
        return this.client.get(url, config);
    }

    async post<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<ApiResponse<T>>> {
        return this.client.post(url, data, config);
    }

    async put<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<ApiResponse<T>>> {
        return this.client.put(url, data, config);
    }

    async patch<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<ApiResponse<T>>> {
        return this.client.patch(url, data, config);
    }

    async delete<T = any>(url: string, config?: any): Promise<AxiosResponse<ApiResponse<T>>> {
        return this.client.delete(url, config);
    }

    // Methods with explicit session context
    async getWithRole<T = any>(url: string, role: string, config?: any): Promise<AxiosResponse<ApiResponse<T>>> {
        const enhancedConfig = {
            ...config,
            sessionContext: { role, forceRole: true }
        };
        return this.client.get(url, enhancedConfig);
    }

    async postWithRole<T = any>(url: string, role: string, data?: any, config?: any): Promise<AxiosResponse<ApiResponse<T>>> {
        const enhancedConfig = {
            ...config,
            sessionContext: { role, forceRole: true }
        };
        return this.client.post(url, data, enhancedConfig);
    }

    // File upload helper
    async uploadFile<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<AxiosResponse<ApiResponse<T>>> {
        const formData = new FormData();
        formData.append('file', file);

        return this.client.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(progress);
                }
            },
        });
    }

    // Batch requests helper
    async batch<T = any>(requests: Array<() => Promise<AxiosResponse<ApiResponse<T>>>>): Promise<AxiosResponse<ApiResponse<T>>[]> {
        try {
            const responses = await Promise.all(requests.map(request => request()));
            return responses;
        } catch (error) {
            console.error('Batch request failed:', error);
            throw error;
        }
    }

    // Health check
    async healthCheck(): Promise<boolean> {
        try {
            const response = await this.client.get('/health', { timeout: 3000 });
            return response.data.success;
        } catch (error) {
            return false;
        }
    }

    // Get base URL for external use
    getBaseURL(): string {
        return this.baseURL;
    }

    // Update auth token
    setAuthToken(token: string, userType: 'client' | 'admin' | 'superadmin' | 'agent' = 'client'): void {
        localStorage.setItem(`${userType}Token`, token);
    }

    // Clear auth token
    clearAuthToken(userType?: 'client' | 'admin' | 'superadmin' | 'agent'): void {
        if (userType) {
            localStorage.removeItem(`${userType}Token`);
            localStorage.removeItem(`${userType}User`);
        } else {
            this.clearAllSessions();
        }
    }

    // Check if session exists for role
    hasSession(role: string): boolean {
        const token = localStorage.getItem(`${role}Token`);
        const user = localStorage.getItem(`${role}User`);
        return !!(token && user);
    }

    // Get all active sessions
    getActiveSessions(): string[] {
        return ['client', 'admin', 'agent', 'superadmin'].filter(role => this.hasSession(role));
    }
}

// Create and export the singleton instance
export const apiClient = new ApiClient();

// Export types for external use
export type { ApiError, ApiResponse };