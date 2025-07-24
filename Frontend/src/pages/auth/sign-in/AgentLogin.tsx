// Frontend/src/pages/auth/sign-in/AgentLogin.tsx
import SignInCard from '@/pages/auth/sign-in/components/SignInCard';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AgentLogin() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 flex items-center justify-center relative">
            <ThemeToggle />

            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob dark:bg-red-600 dark:opacity-30"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000 dark:bg-orange-600 dark:opacity-30"></div>
                <div className="absolute top-40 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000 dark:bg-yellow-600 dark:opacity-30"></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                <SignInCard loginType="agent" />
            </div>
        </div>
    );
}