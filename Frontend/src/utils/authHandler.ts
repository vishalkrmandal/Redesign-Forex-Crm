// Frontend\src\utils\authHandler.ts

export const handleUnauthorized = () => {
    // ... the same function as aboveconst handleUnauthorized = () => {
    console.log('Unauthorized access - handling logout.');

    // Determine current role from path or localStorage
    const currentPath = window.location.pathname;
    let activeRole: string | null = null;

    // Try to get active role from current path
    if (currentPath.startsWith('/superadmin')) {
        activeRole = 'superadmin';
    } else if (currentPath.startsWith('/admin')) {
        activeRole = 'admin';
    } else if (currentPath.startsWith('/agent')) {
        activeRole = 'agent';
    } else if (currentPath.startsWith('/client')) {
        activeRole = 'client';
    }

    // Additional check: if no role from path, check localStorage
    if (!activeRole) {
        if (localStorage.getItem('adminToken')) {
            activeRole = 'admin';
        } else if (localStorage.getItem('superadminToken')) {
            activeRole = 'superadmin';
        } else if (localStorage.getItem('agentToken')) {
            activeRole = 'agent';
        } else if (localStorage.getItem('clientToken')) {
            activeRole = 'client';
        }
    }

    console.log(`Detected active role: ${activeRole}`);

    // Clear tokens and user data for the active role
    if (activeRole) {
        localStorage.removeItem(`${activeRole}Token`);
        localStorage.removeItem(`${activeRole}User`);
        console.log(`Cleared ${activeRole} session data`);
    } else {
        // Fallback: clear all auth data
        const keysToRemove = [
            'adminToken', 'adminUser', 'clientToken', 'clientUser',
            'superadminToken', 'superadminUser', 'agentToken', 'agentUser',
            'token', 'user', 'isImpersonated'
        ];
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log('Cleared all session data');
    }

    // Redirect to appropriate login page
    setTimeout(() => {
        if (activeRole === 'superadmin') {
            window.location.href = '/login/superadmin';
        } else if (activeRole === 'admin') {
            window.location.href = '/login/admin';
        } else if (activeRole === 'agent') {
            window.location.href = '/login/agent';
        } else {
            window.location.href = '/';
        }
    }, 2000); // Small delay to ensure toast shows
};