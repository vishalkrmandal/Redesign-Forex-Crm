// Frontend/src/pages/auth/sign-in/components/SignInCard.tsx

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

    React.useEffect(() => {
        const currentRoleToken = localStorage.getItem(`${loginType}Token`);
        const currentRoleUser = localStorage.getItem(`${loginType}User`);

        if (currentRoleToken && currentRoleUser) {
            try {
                const user = JSON.parse(currentRoleUser);
                if (user && user.role === loginType) {
                    setShowExistingSession(true);
                }
            } catch (error) {
                localStorage.removeItem(`${loginType}Token`);
                localStorage.removeItem(`${loginType}User`);
            }
        }
    }, [loginType]);

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

                if (userRole !== loginType) {
                    const correctPath = userRole === 'client' ? '/login' : `/login/${userRole}`;
                    toast.error(`This login interface is for ${loginType}s only. Your account role is ${userRole}. Please use ${correctPath}`);

                    setTimeout(() => {
                        navigate(correctPath);
                    }, 2000);

                    setIsSubmitting(false);
                    return;
                }

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

    const RoleSwitcher = () => {
        const visibleRoles = ROLE_VISIBILITY[loginType];

        return (
            <div className="mb-4">
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
                                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                                    )}
                                </Button>
                            );
                        })}
                </div>
            </div>
        );
    };

    const ExistingSessionAlert = () => {
        if (!showExistingSession) return null;

        const userStr = localStorage.getItem(`${loginType}User`);
        const user = userStr ? JSON.parse(userStr) : null;

        return (
            <Alert className="mb-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                <UserCheck className="h-4 w-4 text-blue-600" />
                <div className="ml-2">
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                        <div className="text-sm font-medium mb-2">
                            Already logged in as: <strong>{user?.firstname} {user?.lastname}</strong>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                size="sm"
                                onClick={handleUseExistingSession}
                                className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Continue as {user?.firstname}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleLoginAsNewUser}
                                className="h-7 text-xs border-blue-600 text-blue-600 hover:bg-blue-50"
                            >
                                Login as Different User
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleLogoutFromRole}
                                className="h-7 text-xs border-red-600 text-red-600 hover:bg-red-50"
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
                <CardHeader className="text-center space-y-2 pb-4 pt-6">
                    {/* Logo */}
                    <div className="mx-auto flex items-center justify-center -my-6">
                        <img
                            src="/favicon.png"
                            alt="Logo"
                            className="w-40 h-40 object-contain"
                        />
                    </div>

                    {/* Title */}
                    <CardTitle className={`text-2xl font-bold bg-gradient-to-r ${roleConfig.textGradient} bg-clip-text text-transparent`}>
                        {roleConfig.title}
                    </CardTitle>

                    {/* Description */}
                    <CardDescription className="text-sm text-muted-foreground">
                        {roleConfig.description}
                    </CardDescription>
                </CardHeader>

                <CardContent className="px-6 pb-6">
                    {/* Role Switcher */}
                    <RoleSwitcher />

                    {/* Existing Session Alert */}
                    <ExistingSessionAlert />

                    {/* Other active sessions info */}
                    {activeSessions.filter(session => session !== loginType).length > 0 && (
                        <Alert className="mb-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                            <AlertDescription className="text-xs text-green-800 dark:text-green-200">
                                Other active sessions: {activeSessions.filter(session => session !== loginType).join(', ')}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Login Form */}
                    {!showExistingSession && (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                                {/* Email */}
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm flex items-center gap-1.5">
                                                <Mail className="w-3.5 h-3.5" />
                                                Email Address
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter your email"
                                                    type="email"
                                                    className="h-10 text-sm bg-background/50"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />

                                {/* Password */}
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center justify-between">
                                                <FormLabel className="text-sm flex items-center gap-1.5">
                                                    <Lock className="w-3.5 h-3.5" />
                                                    Password
                                                </FormLabel>
                                                <Button
                                                    type="button"
                                                    variant="link"
                                                    className={`p-0 h-auto text-xs font-medium bg-gradient-to-r ${roleConfig.textGradient} bg-clip-text text-transparent hover:opacity-80`}
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
                                                        className="h-10 text-sm bg-background/50 pr-10"
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
                                                            <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                                        ) : (
                                                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />

                                {/* Remember Me */}
                                <FormField
                                    control={form.control}
                                    name="rememberMe"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    className="w-4 h-4"
                                                />
                                            </FormControl>
                                            <FormLabel className="text-sm font-medium cursor-pointer">
                                                Remember me
                                            </FormLabel>
                                        </FormItem>
                                    )}
                                />

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    className={`w-full h-10 text-sm font-semibold bg-gradient-to-r ${roleConfig.gradient} hover:opacity-90 shadow-md hover:shadow-lg transition-all duration-300`}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Signing in...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <LogIn className="w-3.5 h-3.5" />
                                            Sign In as {loginType.charAt(0).toUpperCase() + loginType.slice(1)}
                                        </div>
                                    )}
                                </Button>

                                {/* Signup link — clients only */}
                                {loginType === 'client' && (
                                    <div className="text-center pt-1">
                                        <p className="text-sm text-muted-foreground">
                                            Don't have an account?{" "}
                                            <Button
                                                variant="link"
                                                className={`p-0 h-auto text-sm font-semibold bg-gradient-to-r ${roleConfig.textGradient} bg-clip-text text-transparent hover:opacity-80`}
                                                onClick={() => navigate('/signup')}
                                            >
                                                <UserPlus className="w-3.5 h-3.5 mr-1" />
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