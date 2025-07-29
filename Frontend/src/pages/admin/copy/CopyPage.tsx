// Frontend/src/pages/admin/copy/CopyPage.tsx
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import axios from 'axios';

interface CopyRequest {
    _id: string;
    user: {
        _id: string;
        firstname: string;
        lastname: string;
        email: string;
        phone?: string;
        country?: {
            name: string;
            state?: string;
        };
        dateofbirth?: string;
    };
    account?: {
        _id: string;
        mt5Account: string;
        accountType: string;
        leverage?: string;
        groupName?: string;
        balance?: number;
        equity?: number;
    };
    accounts?: {
        _id: string;
        mt5Account: string;
        accountType: string;
        leverage?: string;
        groupName?: string;
        balance?: number;
        equity?: number;
    }[];
    copyType: string;
    status: 'pending' | 'accepted' | 'rejected';
    reason?: string;
    processedBy?: {
        firstname: string;
        lastname: string;
        email: string;
    };
    processedAt?: string;
    createdAt: string;
}

interface Pagination {
    page: number;
    pages: number;
    total: number;
    limit: number;
}

interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: Pagination;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

const CopyPage: React.FC = () => {
    const [copyRequests, setCopyRequests] = useState<CopyRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        pages: 1,
        total: 0,
        limit: 10
    });

    // Dialog states
    const [selectedRequest, setSelectedRequest] = useState<CopyRequest | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [processingAction, setProcessingAction] = useState(false);
    const [actionError, setActionError] = useState('');

    const API_URL = import.meta.env.VITE_API_URL;

    // Get auth token
    const getAuthToken = () => {
        return localStorage.getItem('adminToken');
    };

    // Create axios instance with default config
    const createApiClient = () => {
        const client = axios.create({
            baseURL: API_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add auth token to requests
        client.interceptors.request.use((config) => {
            const token = getAuthToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        return client;
    };

    // ADMIN API SERVICES
    const adminApiService = {
        // Get all copy requests (admin)
        getAllCopyRequests: async (
            page = 1,
            limit = 10,
            status?: string,
            search?: string
        ): Promise<PaginatedResponse<CopyRequest>> => {
            const apiClient = createApiClient();
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(status && status !== 'all' && { status }),
                ...(search && { search }),
            });

            const response = await apiClient.get<PaginatedResponse<CopyRequest>>(
                `/api/copy/admin/requests?${params}`
            );
            return response.data;
        },

        // Get copy request details
        getCopyRequestDetails: async (id: string): Promise<CopyRequest> => {
            const apiClient = createApiClient();
            const response = await apiClient.get<ApiResponse<CopyRequest>>(`/api/copy/admin/request/${id}`);
            return response.data.data;
        },

        // Accept copy request
        acceptCopyRequest: async (id: string): Promise<CopyRequest> => {
            const apiClient = createApiClient();
            const response = await apiClient.put<ApiResponse<CopyRequest>>(`/api/copy/admin/accept/${id}`);
            return response.data.data;
        },

        // Reject copy request
        rejectCopyRequest: async (id: string, reason: string): Promise<CopyRequest> => {
            const apiClient = createApiClient();
            const response = await apiClient.put<ApiResponse<CopyRequest>>(
                `/api/copy/admin/reject/${id}`,
                { reason }
            );
            return response.data.data;
        },
    };

    // Fetch copy requests
    const fetchCopyRequests = async (page = 1) => {
        setLoading(true);
        try {
            const response = await adminApiService.getAllCopyRequests(
                page,
                pagination.limit,
                statusFilter,
                searchTerm
            );
            setCopyRequests(response.data);
            setPagination(response.pagination);
        } catch (error) {
            console.error('Error fetching copy requests:', error);
        } finally {
            setLoading(false);
        }
    };

    // Accept request
    const handleAccept = async (requestId: string) => {
        setProcessingAction(true);
        setActionError('');

        try {
            await adminApiService.acceptCopyRequest(requestId);
            // Refresh the list
            fetchCopyRequests(pagination.page);
            if (showDetailsModal) {
                setShowDetailsModal(false);
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to accept request';
            setActionError(errorMessage);
        } finally {
            setProcessingAction(false);
        }
    };

    // Reject request
    const handleReject = async () => {
        if (!selectedRequest || !rejectReason.trim()) {
            setActionError('Rejection reason is required');
            return;
        }

        setProcessingAction(true);
        setActionError('');

        try {
            await adminApiService.rejectCopyRequest(selectedRequest._id, rejectReason.trim());
            setShowRejectModal(false);
            setRejectReason('');
            setSelectedRequest(null);
            if (showDetailsModal) {
                setShowDetailsModal(false);
            }
            // Refresh the list
            fetchCopyRequests(pagination.page);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to reject request';
            setActionError(errorMessage);
        } finally {
            setProcessingAction(false);
        }
    };

    // View details
    const handleViewDetails = async (requestId: string) => {
        try {
            const requestDetails = await adminApiService.getCopyRequestDetails(requestId);
            setSelectedRequest(requestDetails);
            setShowDetailsModal(true);
        } catch (error) {
            console.error('Error fetching request details:', error);
        }
    };

    // Status badge
    const getStatusBadge = (status: string) => {
        const baseClasses = "w-fit px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1";
        switch (status) {
            case 'pending':
                return (
                    <span className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300`}>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        Pending
                    </span>
                );
            case 'accepted':
                return (
                    <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`}>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Accepted
                    </span>
                );
            case 'rejected':
                return (
                    <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300`}>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        Rejected
                    </span>
                );
            default:
                return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
        }
    };

    // Function to determine dropdown position
    const getDropdownPosition = (index: number, totalItems: number) => {
        const isNearBottom = index >= totalItems - 2; // Last 2 items
        return isNearBottom ? 'bottom-full mb-1' : 'top-full mt-1';
    };

    // Handle search with debounce
    useEffect(() => {
        const delayedSearch = setTimeout(() => {
            fetchCopyRequests(1);
        }, 500);

        return () => clearTimeout(delayedSearch);
    }, [searchTerm, statusFilter]);

    // Clear action error after 5 seconds
    useEffect(() => {
        if (actionError) {
            const timer = setTimeout(() => {
                setActionError('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [actionError]);

    useEffect(() => {
        fetchCopyRequests();
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Close all dropdowns
            const dropdowns = document.querySelectorAll('[id^="dropdown-"], [id^="mobile-dropdown-"]');
            dropdowns.forEach(dropdown => {
                if (
                    !dropdown.contains(event.target as Node) &&
                    !(event.target instanceof Element && event.target.closest('button[onclick*="dropdown"]'))
                ) {
                    dropdown.classList.add('hidden');
                }
            });

            // Close view details modal when clicking outside
            if (showDetailsModal) {
                const modal = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
                const modalContent = modal?.querySelector('.bg-white.dark\\:bg-gray-800');
                if (modal && !modalContent?.contains(event.target as Node)) {
                    setShowDetailsModal(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDetailsModal]); // Add showDetailsModal to dependencies

    return (
        <div className="container -mt-3 -mr-2 pl-0.5 md:mx-auto p-4 ">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                            <path d="M3 5a2 2 0 012-2h1a3 3 0 003 3h2a3 3 0 003-3h1a2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2V5h-2v6z" />
                        </svg>
                        <h1 className="text-xl font-semibold">Copy Trading Requests</h1>
                    </div>
                </div>

                <div className="p-6">
                    {/* Global Action Error Alert */}
                    {actionError && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-800">{actionError}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Search and Filter */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search by name, email, or account..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                            </svg>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="block w-[140px] px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                            <span className="ml-2">Loading requests...</span>
                        </div>
                    ) : copyRequests.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No copy requests found
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                            <th className="text-left p-3 font-medium text-gray-900 dark:text-gray-100">User</th>
                                            <th className="text-left p-3 font-medium text-gray-900 dark:text-gray-100">Accounts</th>
                                            <th className="text-left p-3 font-medium text-gray-900 dark:text-gray-100">Copy Type</th>
                                            <th className="text-left p-3 font-medium text-gray-900 dark:text-gray-100">Date</th>
                                            <th className="text-left p-3 font-medium text-gray-900 dark:text-gray-100">Status</th>
                                            <th className="text-left p-3 font-medium text-gray-900 dark:text-gray-100">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {copyRequests.map((request) => (
                                            <tr key={request._id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="p-3">
                                                    <div>
                                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                                            {request.user.firstname} {request.user.lastname}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {request.user.email}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {request.accounts && request.accounts.length > 0 ? (
                                                            request.accounts.map((account, index) => (
                                                                <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200">
                                                                    {account.mt5Account}
                                                                </span>
                                                            ))
                                                        ) : request.account ? (
                                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200">
                                                                {request.account.mt5Account}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-500">No accounts</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                        {request.copyType}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <div className="text-sm text-gray-900 dark:text-gray-100">
                                                        {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {format(new Date(request.createdAt), 'hh:mm a')}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div>
                                                        {getStatusBadge(request.status)}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="relative">
                                                        <button
                                                            type="button"
                                                            disabled={processingAction}
                                                            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
                                                            onClick={() => {
                                                                const dropdown = document.getElementById(`dropdown-${request._id}`);
                                                                dropdown?.classList.toggle('hidden');
                                                            }}
                                                        >
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                            </svg>
                                                        </button>
                                                        <div
                                                            id={`dropdown-${request._id}`}
                                                            className={`hidden absolute right-0 ${getDropdownPosition(copyRequests.indexOf(request), copyRequests.length)} w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg z-[9999] border border-gray-200 dark:border-gray-700`}
                                                        >
                                                            <div className="py-1">
                                                                <button
                                                                    onClick={() => {
                                                                        handleViewDetails(request._id);
                                                                        document.getElementById(`dropdown-${request._id}`)?.classList.add('hidden');
                                                                    }}
                                                                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                                                                >
                                                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                    View Details
                                                                </button>
                                                                {request.status === 'pending' && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => {
                                                                                handleAccept(request._id);
                                                                                document.getElementById(`dropdown-${request._id}`)?.classList.add('hidden');
                                                                            }}
                                                                            disabled={processingAction}
                                                                            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left disabled:opacity-50"
                                                                        >
                                                                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                            </svg>
                                                                            Accept
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedRequest(request);
                                                                                setShowRejectModal(true);
                                                                                setActionError('');
                                                                                document.getElementById(`dropdown-${request._id}`)?.classList.add('hidden');
                                                                            }}
                                                                            disabled={processingAction}
                                                                            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left disabled:opacity-50"
                                                                        >
                                                                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                            </svg>
                                                                            Reject
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden space-y-4">
                                {copyRequests.map((request) => (
                                    <div key={request._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                                    {request.user.firstname} {request.user.lastname}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {request.user.email}
                                                </div>
                                            </div>
                                            {getStatusBadge(request.status)}
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Accounts:</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {request.accounts && request.accounts.length > 0 ? (
                                                        request.accounts.map((account, index) => (
                                                            <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200">
                                                                {account.mt5Account}
                                                            </span>
                                                        ))
                                                    ) : request.account ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200">
                                                            {request.account.mt5Account}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-500">No accounts</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Copy Type:</span>
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                    {request.copyType}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Date:</span>
                                                <span>{format(new Date(request.createdAt), 'MMM dd, yyyy • hh:mm a')}</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-end mt-4">
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    disabled={processingAction}
                                                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
                                                    onClick={() => {
                                                        const dropdown = document.getElementById(`mobile-dropdown-${request._id}`);
                                                        dropdown?.classList.toggle('hidden');
                                                    }}
                                                >
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                </button>
                                                <div
                                                    id={`mobile-dropdown-${request._id}`}
                                                    className={`hidden absolute right-0 ${getDropdownPosition(copyRequests.indexOf(request), copyRequests.length)} w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-[9999] border border-gray-200 dark:border-gray-700`}
                                                >
                                                    <div className="py-1">
                                                        <button
                                                            onClick={() => {
                                                                handleViewDetails(request._id);
                                                                document.getElementById(`mobile-dropdown-${request._id}`)?.classList.add('hidden');
                                                            }}
                                                            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                                                        >
                                                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                            </svg>
                                                            View Details
                                                        </button>
                                                        {request.status === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        handleAccept(request._id);
                                                                        document.getElementById(`mobile-dropdown-${request._id}`)?.classList.add('hidden');
                                                                    }}
                                                                    disabled={processingAction}
                                                                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left disabled:opacity-50"
                                                                >
                                                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                    Accept
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedRequest(request);
                                                                        setShowRejectModal(true);
                                                                        setActionError('');
                                                                        document.getElementById(`mobile-dropdown-${request._id}`)?.classList.add('hidden');
                                                                    }}
                                                                    disabled={processingAction}
                                                                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left disabled:opacity-50"
                                                                >
                                                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                    </svg>
                                                                    Reject
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between mt-6">
                                <div className="text-sm text-gray-500">
                                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                                    {pagination.total} results
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500">Rows per page:</span>
                                        <select
                                            value={pagination.limit}
                                            onChange={(e) => {
                                                const newLimit = parseInt(e.target.value);
                                                setPagination(prev => ({ ...prev, limit: newLimit }));
                                                fetchCopyRequests(1);
                                            }}
                                            className="border border-gray-300 rounded-sm px-2 py-1 text-sm"
                                        >
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => fetchCopyRequests(pagination.page - 1)}
                                            disabled={pagination.page === 1 || loading}
                                            className="px-2 py-1 text-sm border border-gray-300 rounded-sm disabled:opacity-50"
                                        >
                                            Prev
                                        </button>

                                        <div className="flex items-center gap-1 flex-wrap">
                                            {Array.from({ length: Math.min(5, pagination.pages) }, (_, index) => {
                                                let pageNum;
                                                if (pagination.pages <= 5) {
                                                    pageNum = index + 1;
                                                } else if (pagination.page <= 3) {
                                                    pageNum = index + 1;
                                                } else if (pagination.page >= pagination.pages - 2) {
                                                    pageNum = pagination.pages - 4 + index;
                                                } else {
                                                    pageNum = pagination.page - 2 + index;
                                                }

                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => fetchCopyRequests(pageNum)}
                                                        className={`w-8 h-8 text-sm rounded-sm ${pageNum === pagination.page
                                                            ? 'bg-blue-500 text-white'
                                                            : 'border border-gray-300 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <button
                                            onClick={() => fetchCopyRequests(pagination.page + 1)}
                                            disabled={pagination.page === pagination.pages || loading}
                                            className="px-2 py-1 text-sm border border-gray-300 rounded-sm disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* View Details Modal */}
            {showDetailsModal && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold">Copy Request Details</h2>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* User Information */}
                            <div>
                                <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">User Information</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Name:</span>
                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                            {selectedRequest.user.firstname} {selectedRequest.user.lastname}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Email:</span>
                                        <div className="font-medium text-gray-900 dark:text-gray-100">{selectedRequest.user.email}</div>
                                    </div>
                                    {selectedRequest.user.phone && (
                                        <div>
                                            <span className="text-gray-500">Phone:</span>
                                            <div className="font-medium text-gray-900 dark:text-gray-100">{selectedRequest.user.phone}</div>
                                        </div>
                                    )}
                                    {selectedRequest.user.country && (
                                        <div>
                                            <span className="text-gray-500">Country:</span>
                                            <div className="font-medium text-gray-900 dark:text-gray-100">
                                                {selectedRequest.user.country.name}
                                                {selectedRequest.user.country.state && `, ${selectedRequest.user.country.state}`}
                                            </div>
                                        </div>
                                    )}
                                    {selectedRequest.user.dateofbirth && (
                                        <div>
                                            <span className="text-gray-500">Date of Birth:</span>
                                            <div className="font-medium text-gray-900 dark:text-gray-100">
                                                {format(new Date(selectedRequest.user.dateofbirth), 'MMM dd, yyyy')}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Account Information */}
                            <div>
                                <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Account Information</h3>
                                <div className="space-y-4">
                                    {(selectedRequest.accounts || []).map((account, index) => (
                                        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-500">MT5 Account:</span>
                                                    <div className="font-medium text-gray-900 dark:text-gray-100">{account.mt5Account}</div>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Account Type:</span>
                                                    <div className="font-medium text-gray-900 dark:text-gray-100">{account.accountType}</div>
                                                </div>
                                                {account.leverage && (
                                                    <div>
                                                        <span className="text-gray-500">Leverage:</span>
                                                        <div className="font-medium text-gray-900 dark:text-gray-100">{account.leverage}</div>
                                                    </div>
                                                )}
                                                {account.balance !== undefined && (
                                                    <div>
                                                        <span className="text-gray-500">Balance:</span>
                                                        <div className="font-medium text-gray-900 dark:text-gray-100">${account.balance.toFixed(2)}</div>
                                                    </div>
                                                )}
                                                {account.equity !== undefined && (
                                                    <div>
                                                        <span className="text-gray-500">Equity:</span>
                                                        <div className="font-medium text-gray-900 dark:text-gray-100">${account.equity.toFixed(2)}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Request Information */}
                            <div>
                                <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Request Information</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Copy Type:</span>
                                        <div className="font-medium">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                {selectedRequest.copyType}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Status:</span>
                                        <div className="font-medium">{getStatusBadge(selectedRequest.status)}</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Requested At:</span>
                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                            {format(new Date(selectedRequest.createdAt), 'MMM dd, yyyy • hh:mm a')}
                                        </div>
                                    </div>
                                    {selectedRequest.processedAt && (
                                        <div>
                                            <span className="text-gray-500">Processed At:</span>
                                            <div className="font-medium text-gray-900 dark:text-gray-100">
                                                {format(new Date(selectedRequest.processedAt), 'MMM dd, yyyy • hh:mm a')}
                                            </div>
                                        </div>
                                    )}
                                    {selectedRequest.processedBy && (
                                        <div className="col-span-full">
                                            <span className="text-gray-500">Processed By:</span>
                                            <div className="font-medium text-gray-900 dark:text-gray-100">
                                                {selectedRequest.processedBy.firstname} {selectedRequest.processedBy.lastname}
                                                <span className="text-sm text-gray-500 ml-2">
                                                    ({selectedRequest.processedBy.email})
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    {selectedRequest.reason && (
                                        <div className="col-span-full">
                                            <span className="text-gray-500">Reason:</span>
                                            <div className="font-medium text-red-600 mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                                                {selectedRequest.reason}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons in Details Modal */}
                            {selectedRequest.status === 'pending' && (
                                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={() => handleAccept(selectedRequest._id)}
                                        disabled={processingAction}
                                        className="px-4 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-600 dark:hover:bg-green-900/30"
                                    >
                                        {processingAction ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700 inline-block mr-2"></div>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                Accept
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDetailsModal(false);
                                            setShowRejectModal(true);
                                            setActionError('');
                                        }}
                                        disabled={processingAction}
                                        className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 dark:bg-red-900/20 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/30"
                                    >
                                        <svg className="w-4 h-4 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Reject Copy Request</h2>
                                <button
                                    onClick={() => {
                                        setShowRejectModal(false);
                                        setRejectReason('');
                                        setActionError('');
                                    }}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            {actionError && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-red-800">{actionError}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Rejection Reason *
                                </label>
                                <textarea
                                    placeholder="Please provide a reason for rejection..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    rows={4}
                                    maxLength={500}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                />
                                <div className="text-xs text-gray-500 mt-1">
                                    {rejectReason.length}/500 characters
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setShowRejectModal(false);
                                        setRejectReason('');
                                        setActionError('');
                                    }}
                                    disabled={processingAction}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={processingAction || !rejectReason.trim()}
                                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                                >
                                    {processingAction ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                                            Rejecting...
                                        </>
                                    ) : (
                                        'Reject Request'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CopyPage;