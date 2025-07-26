// Frontend/src/pages/auth/sign-in/components/SignInCard.tsx - FIXED VERSION

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Eye, EyeOff, Mail, Lock, LogIn, UserPlus, Shield, Users, Crown, X, UserCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import ForgotPassword from './ForgotPassword';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    rememberMe: z.boolean().default(false)
});

// Role configuration
const ROLE_CONFIG = {
    client: {
        title: 'Client Portal',
        description: 'Access your trading account',
        icon: Users,
        gradient: 'from-blue-500 to-purple-600',
        textGradient: 'from-blue-600 to-purple-600',
        path: '/login'
    },
    admin: {
        title: 'Admin Dashboard',
        description: 'Manage users and system settings',
        icon: Shield,
        gradient: 'from-green-500 to-blue-600',
        textGradient: 'from-green-600 to-blue-600',
        path: '/login/admin'
    },
    superadmin: {
        title: 'Super Admin',
        description: 'Full system administration',
        icon: Crown,
        gradient: 'from-purple-500 to-pink-600',
        textGradient: 'from-purple-600 to-pink-600',
        path: '/login/superadmin'
    },
    agent: {
        title: 'Agent Portal',
        description: 'Manage your clients and commissions',
        icon: UserPlus,
        gradient: 'from-orange-500 to-red-600',
        textGradient: 'from-orange-600 to-red-600',
        path: '/login/agent'
    }
};

// Role visibility rules
const ROLE_VISIBILITY = {
    client: ['client'],
    agent: ['agent'],
    admin: ['client', 'admin'],
    superadmin: ['client', 'agent', 'admin', 'superadmin']
};

interface SignInCardProps {
    loginType?: 'client' | 'admin' | 'superadmin' | 'agent';
}

export default function SignInCard({ loginType = 'client' }: SignInCardProps) {
    const { getAllActiveSessions, hasValidSession } = useAuth();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [showForgotPassword, setShowForgotPassword] = React.useState(false);
    const [showExistingSession, setShowExistingSession] = React.useState(false);

    // Get role configuration
    const roleConfig = ROLE_CONFIG[loginType];
    const activeSessions = getAllActiveSessions();

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
            rememberMe: false
        }
    });

    // 🔧 FIXED: Only redirect if current login type has active session
    React.useEffect(() => {
        // Only check token for the CURRENT login type, not all roles
        const currentRoleToken = localStorage.getItem(`${loginType}Token`);
        const currentRoleUser = localStorage.getItem(`${loginType}User`);

        if (currentRoleToken && currentRoleUser) {
            // Only redirect if we have VALID session for current role
            try {
                const user = JSON.parse(currentRoleUser);
                if (user && user.role === loginType) {
                    setShowExistingSession(true);
                }
            } catch (error) {
                // Invalid user data, clear it
                localStorage.removeItem(`${loginType}Token`);
                localStorage.removeItem(`${loginType}User`);
            }
        }
    }, [loginType]); // Only depend on loginType, not navigate

    // Handle existing session actions
    const handleUseExistingSession = () => {
        const defaultPaths = {
            client: '/client/dashboard',
            admin: '/admin/dashboard',
            agent: '/agent/dashboard',
            superadmin: '/superadmin/configure'
        };
        navigate(defaultPaths[loginType]);
    };

    const handleLoginAsNewUser = () => {
        // Clear existing session for this role to allow new login
        localStorage.removeItem(`${loginType}Token`);
        localStorage.removeItem(`${loginType}User`);
        setShowExistingSession(false);
        toast.info(`Previous ${loginType} session cleared. You can now login as a different user.`);
    };

    const handleLogoutFromRole = () => {
        localStorage.removeItem(`${loginType}Token`);
        localStorage.removeItem(`${loginType}User`);
        setShowExistingSession(false);
        toast.success(`Logged out from ${loginType} session`);
    };

    const onSubmit = async (values: z.infer<typeof loginSchema>) => {
        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: values.email,
                    password: values.password,
                    loginType: loginType
                }),
            });

            const data = await response.json();

            if (data.success) {
                const userRole = data.user.role;

                // Validate if user role matches the login interface
                if (userRole !== loginType) {
                    const correctPath = userRole === 'client' ? '/login' : `/login/${userRole}`;
                    toast.error(`This login interface is for ${loginType}s only. Your account role is ${userRole}. Please use ${correctPath}`);

                    setTimeout(() => {
                        navigate(correctPath);
                    }, 2000);

                    setIsSubmitting(false);
                    return;
                }

                // Store token and user info in localStorage based on role
                localStorage.setItem(`${userRole}Token`, data.token);
                localStorage.setItem(`${userRole}User`, JSON.stringify(data.user));

                if (data.user.isEmailVerified === true) {
                    toast.success('Login successful! Redirecting...', { duration: 2000 });

                    setTimeout(() => {
                        if (userRole === 'superadmin') {
                            window.location.href = '/superadmin/configure';
                        } else if (userRole === 'agent') {
                            window.location.href = '/agent/dashboard';
                        } else if (userRole === 'admin') {
                            window.location.href = '/admin/dashboard';
                        } else {
                            window.location.href = '/client/dashboard';
                        }
                    }, 1000);
                } else {
                    toast.error('Please verify your email address first');
                }
            } else {
                toast.error(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error('An error occurred during login');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Role switcher component with visibility rules
    const RoleSwitcher = () => {
        const visibleRoles = ROLE_VISIBILITY[loginType];

        return (
            <div className="mb-6">
                <div className="flex flex-wrap gap-2 justify-center">
                    {Object.entries(ROLE_CONFIG)
                        .filter(([role]) => visibleRoles.includes(role))
                        .map(([role, config]) => {
                            const isActive = loginType === role;
                            const hasSession = hasValidSession(role);

                            return (
                                <Button
                                    key={role}
                                    variant={isActive ? "default" : "outline"}
                                    size="sm"
                                    className={`capitalize relative ${isActive ? `bg-gradient-to-r ${config.gradient} text-white` : ''}`}
                                    onClick={() => navigate(config.path)}
                                >
                                    <config.icon className="w-3 h-3 mr-1" />
                                    {role}
                                    {hasSession && !isActive && (
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                    )}
                                </Button>
                            );
                        })}
                </div>
            </div>
        );
    };

    // Existing Session Alert
    const ExistingSessionAlert = () => {
        if (!showExistingSession) return null;

        const userStr = localStorage.getItem(`${loginType}User`);
        const user = userStr ? JSON.parse(userStr) : null;

        return (
            <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                <UserCheck className="h-4 w-4 text-blue-600" />
                <div className="ml-2">
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                        <div className="font-medium mb-2">
                            You're already logged in as: <strong>{user?.firstname} {user?.lastname}</strong>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                size="sm"
                                onClick={handleUseExistingSession}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Continue as {user?.firstname}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleLoginAsNewUser}
                                className="border-blue-600 text-blue-600 hover:bg-blue-50"
                            >
                                Login as Different User
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleLogoutFromRole}
                                className="border-red-600 text-red-600 hover:bg-red-50"
                            >
                                <X className="w-3 h-3 mr-1" />
                                Logout
                            </Button>
                        </div>
                    </AlertDescription>
                </div>
            </Alert>
        );
    };

    return (
        <>
            <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader className="text-center space-y-4 pb-8">
                    <div className="mx-auto rounded-full flex items-center justify-center mb-4">
                        <img
                            src="/favicon.png"
                            alt="Logo"
                            className="w-24 h-20"
                        />
                    </div>
                    <CardTitle className={`text-3xl font-bold bg-gradient-to-r ${roleConfig.textGradient} bg-clip-text text-transparent`}>
                        {roleConfig.title}
                    </CardTitle>
                    <CardDescription className="text-lg text-muted-foreground">
                        {roleConfig.description}
                    </CardDescription>
                </CardHeader>

                <CardContent className="px-8 pb-8">
                    {/* Role Switcher */}
                    <RoleSwitcher />

                    {/* Existing Session Alert */}
                    <ExistingSessionAlert />

                    {/* Active Sessions Info - Only show other sessions, not current */}
                    {activeSessions.filter(session => session !== loginType).length > 0 && (
                        <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                            <AlertDescription className="text-green-800 dark:text-green-200">
                                Other active sessions: {activeSessions.filter(session => session !== loginType).join(', ')}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Login Form - Show if no existing session OR user chose to login as different user */}
                    {!showExistingSession && (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Mail className="w-4 h-4" />
                                                Email Address
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter your email"
                                                    type="email"
                                                    className="h-12 bg-background/50"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center justify-between">
                                                <FormLabel className="flex items-center gap-2">
                                                    <Lock className="w-4 h-4" />
                                                    Password
                                                </FormLabel>
                                                <Button
                                                    type="button"
                                                    variant="link"
                                                    className={`p-0 h-auto text-sm font-medium bg-gradient-to-r ${roleConfig.textGradient} bg-clip-text text-transparent hover:opacity-80`}
                                                    onClick={() => setShowForgotPassword(true)}
                                                >
                                                    Forgot password?
                                                </Button>
                                            </div>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        placeholder="Enter your password"
                                                        type={showPassword ? "text" : "password"}
                                                        className="h-12 bg-background/50 pr-10"
                                                        {...field}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        {showPassword ? (
                                                            <EyeOff className="h-4 w-4" />
                                                        ) : (
                                                            <Eye className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="rememberMe"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="text-sm font-medium">
                                                    Remember me
                                                </FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="submit"
                                    className={`w-full h-12 text-lg font-semibold bg-gradient-to-r ${roleConfig.gradient} hover:opacity-90 shadow-lg hover:shadow-xl transition-all duration-300`}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Signing in...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <LogIn className="w-4 h-4" />
                                            Sign In as {loginType.charAt(0).toUpperCase() + loginType.slice(1)}
                                        </div>
                                    )}
                                </Button>

                                {/* Only show signup link for client login */}
                                {loginType === 'client' && (
                                    <div className="text-center pt-4">
                                        <p className="text-muted-foreground">
                                            Don't have an account?{" "}
                                            <Button
                                                variant="link"
                                                className={`p-0 h-auto font-semibold bg-gradient-to-r ${roleConfig.textGradient} bg-clip-text text-transparent hover:opacity-80`}
                                                onClick={() => navigate('/signup')}
                                            >
                                                <UserPlus className="w-4 h-4 mr-1" />
                                                Create account
                                            </Button>
                                        </p>
                                    </div>
                                )}
                            </form>
                        </Form>
                    )}
                </CardContent>
            </Card>

            <ForgotPassword
                open={showForgotPassword}
                handleClose={() => setShowForgotPassword(false)}
            />
        </>
    );
}