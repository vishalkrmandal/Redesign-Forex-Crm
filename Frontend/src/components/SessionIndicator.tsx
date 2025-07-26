// Frontend/src/components/SessionIndicator.tsx - Complete session management component

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Shield,
    Crown,
    UserPlus,
    ChevronDown,
    LogOut,
    ExternalLink
} from 'lucide-react';

interface SessionIndicatorProps {
    className?: string;
}

const ROLE_CONFIG = {
    client: {
        name: 'Client',
        icon: Users,
        color: 'bg-blue-500',
        hoverColor: 'hover:bg-blue-600',
        path: '/client/dashboard'
    },
    admin: {
        name: 'Admin',
        icon: Shield,
        color: 'bg-green-500',
        hoverColor: 'hover:bg-green-600',
        path: '/admin/dashboard'
    },
    superadmin: {
        name: 'Super Admin',
        icon: Crown,
        color: 'bg-purple-500',
        hoverColor: 'hover:bg-purple-600',
        path: '/superadmin/configure'
    },
    agent: {
        name: 'Agent',
        icon: UserPlus,
        color: 'bg-orange-500',
        hoverColor: 'hover:bg-orange-600',
        path: '/agent/dashboard'
    }
};

const SessionIndicator: React.FC<SessionIndicatorProps> = ({ className = '' }) => {
    const {
        activeRole,
        getAllActiveSessions,
        switchRole,
        logout,
        hasMultipleRoles
    } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

    const activeSessions = getAllActiveSessions();
    const multipleRoles = hasMultipleRoles();

    // Calculate dropdown position
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + 8, // 8px gap
                right: window.innerWidth - rect.right
            });
        }
    }, [isOpen]);

    if (!activeRole || activeSessions.length === 0) {
        return null;
    }

    const currentRoleConfig = ROLE_CONFIG[activeRole as keyof typeof ROLE_CONFIG];
    const CurrentIcon = currentRoleConfig.icon;

    const handleRoleSwitch = (role: string) => {
        if (role !== activeRole) {
            switchRole(role, navigate);
        }
        setIsOpen(false);
    };

    const handleNewTab = (role: string) => {
        const config = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG];
        window.open(config.path, '_blank');
        setIsOpen(false);
    };

    const handleLogout = (role: string) => {
        logout(role, navigate);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`}>
            {/* Current session indicator */}
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2 px-3 py-1 rounded-lg text-white 
                    transition-all duration-200 shadow-lg
                    ${currentRoleConfig.color} ${currentRoleConfig.hoverColor}
                    ${multipleRoles ? 'cursor-pointer' : 'cursor-default'}
                `}
            >
                <CurrentIcon className="w-4 h-4" />
                {/* <span className="font-medium text-sm">{currentRoleConfig.name}</span> */}
                {multipleRoles && (
                    <>
                        <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full font-semibold">
                            +{activeSessions.length - 1}
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </>
                )}
            </button>

            {/* Sessions dropdown - rendered in portal */}
            {isOpen && multipleRoles && createPortal(
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-[50] bg-black/20"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div
                        className="fixed z-[60] w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl"
                        style={{
                            top: `${dropdownPosition.top}px`,
                            right: `${dropdownPosition.right}px`
                        }}
                    >
                        <div className="rounded-lg p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Active Sessions</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                You have {activeSessions.length} active session{activeSessions.length > 1 ? 's' : ''}
                            </p>
                        </div>

                        <div className="py-1 max-h-60 overflow-y-auto bg-white dark:bg-gray-800">
                            {activeSessions.map((role) => {
                                const config = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG];
                                const Icon = config.icon;
                                const isCurrent = role === activeRole;

                                return (
                                    <div
                                        key={role}
                                        className={`
                                            flex items-center justify-between px-4 py-1
                                            hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                                            ${isCurrent ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''}
                                        `}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-10 h-10 rounded-full ${config.color} flex items-center justify-center shadow-md`}>
                                                <Icon className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                                    {config.name}
                                                    {isCurrent && (
                                                        <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 px-1 py-1 rounded-full font-medium">
                                                            Current
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    Active session
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex">
                                            {!isCurrent && (
                                                <button
                                                    onClick={() => handleRoleSwitch(role)}
                                                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                                    title="Switch to this session"
                                                >
                                                    <Users className="w-4 h-4" />
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleNewTab(role)}
                                                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                                title="Open in new tab"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={() => handleLogout(role)}
                                                className="p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                                title="Logout from this session"
                                            >
                                                <LogOut className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 rounded-b-lg">
                            <button
                                onClick={() => {
                                    logout(undefined, navigate);
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout from all sessions
                            </button>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    );
};

export default SessionIndicator;