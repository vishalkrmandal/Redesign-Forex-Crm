// Frontend/src/pages/auth/sign-in/SignUp.tsx - Fixed for mobile scrolling with security enhancements

import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { CalendarIcon, Eye, EyeOff, Phone, User, Mail, Lock, Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import LocationSelector from "@/components/ui/location-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Security utility functions
const escapeHtml = (unsafe: string): string => {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

const sanitizeName = (input: string): string => {
    return escapeHtml(input)
        .replace(/[^a-zA-Z\s'\-]/g, '')
        .trim()
        .slice(0, 50);
};

// Enhanced form schema with security validations
const formSchema = z.object({
    firstname: z.string()
        .min(1, "First name is required")
        .max(50, "First name too long")
        .regex(/^[a-zA-Z\s'-]+$/, "Only letters, spaces, hyphens and apostrophes allowed"),

    lastname: z.string()
        .min(1, "Last name is required")
        .max(50, "Last name too long")
        .regex(/^[a-zA-Z\s'-]+$/, "Only letters, spaces, hyphens and apostrophes allowed"),

    country: z.tuple([z.string(), z.string().optional()]),

    phone: z.string()
        .min(10, "Enter a valid phone number")
        .regex(/^[\d\s\-\+\(\)]+$/, "Invalid phone number format"),

    dateofbirth: z.date({ required_error: "Date of birth is required" }),

    email: z.string()
        .email("Invalid email format")
        .max(254, "Email too long"),

    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .max(32, "Password too long")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase and number"),

    confirmPassword: z.string()
        .min(8, "Please confirm your password")
        .max(32, "Password too long"),

    referralCode: z.string()
        .max(20, "Referral code too long")
        .regex(/^[a-zA-Z0-9]*$/, "Invalid referral code format")
        .optional()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
});

interface SignUpProps {
    validReferral?: {
        code: string;
        userName: string;
        preValidated: boolean;
    };
}

export default function SignUp({ validReferral }: SignUpProps) {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [countryName, setCountryName] = useState<string>("");
    const [stateName, setStateName] = useState<string>("");

    const [showResendOption, setShowResendOption] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [isResendingEmail, setIsResendingEmail] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [userEmail, setUserEmail] = useState("");

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            dateofbirth: new Date(),
            firstname: "",
            lastname: "",
            phone: "",
            email: "",
            password: "",
            confirmPassword: "",
            referralCode: validReferral?.code || ""
        },
    });

    useEffect(() => {
        if (validReferral?.preValidated) {
            form.setValue("referralCode", validReferral.code);
        }
    }, [validReferral, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setIsSubmitting(true);

            const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstname: sanitizeName(values.firstname),
                    lastname: sanitizeName(values.lastname),
                    email: escapeHtml(values.email.toLowerCase().trim()),
                    phone: values.phone.replace(/[^\d\+\-\s\(\)]/g, ''),
                    password: values.password,
                    country: [sanitizeName(countryName), sanitizeName(stateName)],
                    referralCode: values.referralCode ? values.referralCode.replace(/[^a-zA-Z0-9]/g, '') : undefined,
                    dateofbirth: values.dateofbirth
                }),
            });

            const data = await response.json();

            if (data.success) {
                setUserEmail(values.email);
                setRegistrationSuccess(true);
                setShowResendOption(false);
                setResendTimer(60);

                toast.success("Registration successful! Please check your email to verify your account.", {
                    duration: 5000
                });

                const timer = setInterval(() => {
                    setResendTimer((prev) => {
                        if (prev <= 1) {
                            setShowResendOption(true);
                            clearInterval(timer);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);

                startVerificationCheck(values.email);
                form.reset();
            } else {
                toast.error(data.message || "Failed to register. Please try again.");
            }
        } catch (error) {
            console.error("Registration error", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    const checkVerificationStatus = async (email: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/check-verification-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: escapeHtml(email.toLowerCase().trim()) }),
            });
            const data = await response.json();
            return data.isVerified;
        } catch (error) {
            console.error("Error checking verification status:", error);
            return false;
        }
    };

    const startVerificationCheck = (email: string) => {
        const checkInterval = setInterval(async () => {
            const isVerified = await checkVerificationStatus(email);
            if (isVerified) {
                clearInterval(checkInterval);
                toast.success("Your email has been verified! Redirecting to login...", { duration: 3000 });
                setTimeout(() => navigate('/?verified=true'), 3000);
            }
        }, 5000);

        setTimeout(() => clearInterval(checkInterval), 600000);
    };

    const resendVerificationEmail = async () => {
        try {
            setIsResendingEmail(true);

            const response = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: escapeHtml(userEmail.toLowerCase().trim()) }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Verification email sent successfully!");
                setShowResendOption(false);
                setResendTimer(60);

                const timer = setInterval(() => {
                    setResendTimer((prev) => {
                        if (prev <= 1) {
                            setShowResendOption(true);
                            clearInterval(timer);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                toast.error(data.message || "Failed to resend email. Please try again.");
            }
        } catch (error) {
            console.error("Resend email error:", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsResendingEmail(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-x-hidden">
            {/* Theme Toggle */}
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle />
            </div>

            {/* Background decoration - desktop only */}
            <div className="absolute inset-0 overflow-hidden hidden md:block">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob dark:bg-purple-600 dark:opacity-30"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000 dark:bg-blue-600 dark:opacity-30"></div>
                <div className="absolute top-40 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000 dark:bg-pink-600 dark:opacity-30"></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full px-4 py-6 md:py-8 lg:py-10">
                <div className="max-w-3xl mx-auto">
                    <Card className="w-full shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">

                        {/* Header */}
                        <CardHeader className="text-center space-y-2 pb-4 pt-6">
                            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-1">
                                <User className="w-6 h-6 text-white" />
                            </div>
                            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Create Your Account
                            </CardTitle>
                            <CardDescription className="text-sm text-muted-foreground px-2">
                                {validReferral?.preValidated && validReferral.userName
                                    ? `Join us today! You were referred by ${escapeHtml(validReferral.userName)}`
                                    : "Join us today and start your journey"}
                            </CardDescription>
                        </CardHeader>

                        {/* Valid Referral Alert */}
                        {validReferral?.preValidated && (
                            <div className="px-6 mb-3">
                                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 py-3">
                                    <Check className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                                    <div className="ml-2">
                                        <AlertTitle className="text-green-800 dark:text-green-200 text-sm font-semibold">
                                            Valid Referral Code!
                                        </AlertTitle>
                                        <AlertDescription className="text-green-700 dark:text-green-300 text-xs">
                                            You were referred by <strong>{escapeHtml(validReferral.userName)}</strong>.
                                            The referral bonus will be applied to your account.
                                        </AlertDescription>
                                    </div>
                                </Alert>
                            </div>
                        )}

                        <CardContent className="px-6 pb-6">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                                    {/* Name Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="firstname"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm flex items-center gap-1.5">
                                                        <User className="w-3.5 h-3.5" />
                                                        First Name
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Enter your first name"
                                                            className="h-10 text-sm bg-background/50"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-xs" />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="lastname"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm flex items-center gap-1.5">
                                                        <User className="w-3.5 h-3.5" />
                                                        Last Name
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Enter your last name"
                                                            className="h-10 text-sm bg-background/50"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-xs" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Location */}
                                    <FormField
                                        control={form.control}
                                        name="country"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm flex items-center gap-1.5">
                                                    <Globe className="w-3.5 h-3.5" />
                                                    Location
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="min-h-[40px]">
                                                        <LocationSelector
                                                            onCountryChange={(country) => {
                                                                setCountryName(country?.name || "");
                                                                form.setValue(field.name, [country?.name || "", stateName || ""]);
                                                            }}
                                                            onStateChange={(state) => {
                                                                setStateName(state?.name || "");
                                                                form.setValue(field.name, [countryName || "", state?.name || ""]);
                                                            }}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-xs" />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Phone and Date of Birth */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm flex items-center gap-1.5">
                                                        <Phone className="w-3.5 h-3.5" />
                                                        Phone Number
                                                    </FormLabel>
                                                    <FormControl>
                                                        <PhoneInput
                                                            placeholder="Enter phone number"
                                                            defaultCountry="IN"
                                                            className="h-10 text-sm"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-xs" />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="dateofbirth"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm flex items-center gap-1.5">
                                                        <CalendarIcon className="w-3.5 h-3.5" />
                                                        Date of Birth
                                                    </FormLabel>
                                                    <FormControl>
                                                        <DatePicker
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            className="h-10 w-full text-sm"
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-xs" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

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
                                                        placeholder="Enter your email address"
                                                        type="email"
                                                        className="h-10 text-sm bg-background/50"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-xs" />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Hidden referral code for pre-validated referrals */}
                                    {validReferral?.preValidated && (
                                        <input type="hidden" {...form.register("referralCode")} />
                                    )}

                                    {/* Password Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm flex items-center gap-1.5">
                                                        <Lock className="w-3.5 h-3.5" />
                                                        Password
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input
                                                                placeholder="Create a strong password"
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
                                                                {showPassword
                                                                    ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                                                    : <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                                                }
                                                            </Button>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="text-xs" />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="confirmPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm flex items-center gap-1.5">
                                                        <Lock className="w-3.5 h-3.5" />
                                                        Confirm Password
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input
                                                                placeholder="Confirm your password"
                                                                type={showConfirmPassword ? "text" : "password"}
                                                                className="h-10 text-sm bg-background/50 pr-10"
                                                                {...field}
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                            >
                                                                {showConfirmPassword
                                                                    ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                                                    : <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                                                }
                                                            </Button>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="text-xs" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-300 mt-2"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Creating Account...
                                            </div>
                                        ) : (
                                            "Create Account"
                                        )}
                                    </Button>

                                    {/* Resend Verification Section */}
                                    {registrationSuccess && (
                                        <div className="text-center py-3 border-t border-gray-200 dark:border-gray-700">
                                            <p className="text-muted-foreground text-sm mb-2">
                                                Didn't receive the verification email?
                                            </p>

                                            {!showResendOption && resendTimer > 0 ? (
                                                <p className="text-xs text-gray-500">
                                                    Resend available in{" "}
                                                    <span className="font-semibold text-blue-600">{resendTimer}</span> seconds
                                                </p>
                                            ) : showResendOption ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 text-xs text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                    onClick={resendVerificationEmail}
                                                    disabled={isResendingEmail}
                                                >
                                                    {isResendingEmail ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                                            Sending...
                                                        </div>
                                                    ) : (
                                                        "Resend Verification Email"
                                                    )}
                                                </Button>
                                            ) : null}
                                        </div>
                                    )}

                                    {/* Sign In Link */}
                                    <div className="text-center pt-2">
                                        <p className="text-sm text-muted-foreground">
                                            Already have an account?{" "}
                                            <Button
                                                variant="link"
                                                className="p-0 h-auto text-sm font-semibold text-blue-600 hover:text-blue-700"
                                                onClick={() => navigate('/')}
                                            >
                                                Sign in here
                                            </Button>
                                        </p>
                                    </div>

                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}