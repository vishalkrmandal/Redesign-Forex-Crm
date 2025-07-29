// Frontend/src/pages/client/copy/CopyRequest.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Clock, CheckCircle, XCircle, Copy, ChevronDown, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import axios from 'axios';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Account {
    _id: string;
    mt5Account: string;
    accountType: string;
    updatedAt: string;
}

interface CopyRequest {
    _id: string;
    account?: {
        mt5Account: string;
        accountType: string;
    };
    accounts?: {
        mt5Account: string;
        accountType: string;
    }[];
    copyType: string;
    status: 'pending' | 'accepted' | 'rejected';
    reason?: string;
    createdAt: string;
}

interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        pages: number;
        total: number;
        limit: number;
    };
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

const CopyRequest = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [copyRequests, setCopyRequests] = useState<CopyRequest[]>([]);
    const [selectedAccounts, setSelectedAccounts] = useState<Account[]>([]);
    const [selectedCopyType, setSelectedCopyType] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [fetchingAccounts, setFetchingAccounts] = useState(true);
    const [fetchingRequests, setFetchingRequests] = useState(true);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);

    const API_URL = import.meta.env.VITE_API_URL;

    // Get auth token
    const getAuthToken = () => {
        return localStorage.getItem('clientToken');
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

    // CLIENT API SERVICES
    const clientApiService = {
        // Get user accounts for copy request
        getUserAccounts: async (): Promise<Account[]> => {
            const apiClient = createApiClient();
            const response = await apiClient.get<ApiResponse<Account[]>>('/api/accounts/copy-accounts');
            return response.data.data;
        },

        // Create copy request with multiple accounts
        createCopyRequest: async (accountIds: string[], copyType: string): Promise<CopyRequest> => {
            const apiClient = createApiClient();
            const response = await apiClient.post<ApiResponse<CopyRequest>>('/api/copy/request', {
                accountIds,
                copyType
            });
            return response.data.data;
        },

        // Get user's copy requests
        getUserCopyRequests: async (page = 1, limit = 10): Promise<PaginatedResponse<CopyRequest>> => {
            const apiClient = createApiClient();
            const response = await apiClient.get<PaginatedResponse<CopyRequest>>(
                `/api/copy/my-requests?page=${page}&limit=${limit}`
            );
            return response.data;
        },
    };

    // Handle account selection
    const handleAccountSelection = (account: Account) => {
        const isSelected = selectedAccounts.some(acc => acc._id === account._id);
        if (isSelected) {
            setSelectedAccounts(selectedAccounts.filter(acc => acc._id !== account._id));
        } else {
            setSelectedAccounts([...selectedAccounts, account]);
        }
    };

    // Remove selected account
    const removeSelectedAccount = (accountId: string) => {
        setSelectedAccounts(selectedAccounts.filter(acc => acc._id !== accountId));
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Fetch user accounts
    const fetchAccounts = async () => {
        try {
            const accountData = await clientApiService.getUserAccounts();
            setAccounts(accountData);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            setError('Failed to fetch accounts');
        } finally {
            setFetchingAccounts(false);
        }
    };

    // Fetch copy requests history
    const fetchCopyRequests = async (page = 1) => {
        try {
            const response = await clientApiService.getUserCopyRequests(page, 10);
            setCopyRequests(response.data);
            setCurrentPage(response.pagination.page);
            setTotalPages(response.pagination.pages);
        } catch (error) {
            console.error('Error fetching copy requests:', error);
        } finally {
            setFetchingRequests(false);
        }
    };

    // Submit copy request
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedAccounts.length === 0 || !selectedCopyType) {
            setError('Please select at least one account and copy type');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const accountIds = selectedAccounts.map(acc => acc._id);
            await clientApiService.createCopyRequest(accountIds, selectedCopyType);
            setSuccess('Copy request submitted successfully!');
            setSelectedAccounts([]);
            setSelectedCopyType('');
            // Refresh the requests list
            fetchCopyRequests(1);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to submit copy request';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setFetchingRequests(true);
            fetchCopyRequests(page);
        }
    };

    // Status badge color
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                    </Badge>
                );
            case 'accepted':
                return (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Accepted
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                        <XCircle className="w-3 h-3 mr-1" />
                        Rejected
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    // Clear messages after 5 seconds
    useEffect(() => {
        if (success || error) {
            const timer = setTimeout(() => {
                setSuccess('');
                setError('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [success, error]);

    useEffect(() => {
        fetchAccounts();
        fetchCopyRequests();
    }, []);

    return (
        <div className="container mx-auto p-4 space-y-6">
            {/* Copy Request Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Copy className="w-5 h-5" />
                        Submit Copy Request
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error/Success Messages */}
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {success && (
                            <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200">
                                <AlertDescription>{success}</AlertDescription>
                            </Alert>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Multi-Select Account Dropdown */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Select Accounts *</label>
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        type="button"
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        disabled={fetchingAccounts}
                                        className="w-full px-3 py-1.5 h-10 border rounded-md bg-background text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                    >
                                        <span className="text-gray-500">
                                            {fetchingAccounts
                                                ? "Loading accounts..."
                                                : selectedAccounts.length === 0
                                                    ? "Choose accounts"
                                                    : `${selectedAccounts.length} account(s) selected`
                                            }
                                        </span>
                                        <ChevronDown className="w-4 h-4" />
                                    </button>

                                    {/* Selected Accounts Display */}
                                    {selectedAccounts.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {selectedAccounts.map((account) => (
                                                <div
                                                    key={account._id}
                                                    className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm"
                                                >
                                                    <span>{account.mt5Account}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSelectedAccount(account._id)}
                                                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Dropdown Menu */}
                                    {isDropdownOpen && (
                                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                            {accounts.map((account) => {
                                                const isSelected = selectedAccounts.some(acc => acc._id === account._id);
                                                return (
                                                    <div
                                                        key={account._id}
                                                        className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                                                        onClick={() => handleAccountSelection(account)}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => { }}
                                                            className="rounded"
                                                        />
                                                        <div className="flex flex-col">
                                                            <div>
                                                                <span className="font-medium">{account.mt5Account}</span>
                                                                <span className="text-xs text-gray-500"> - {account.accountType}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Select Copy Type */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Select Copy Type *</label>
                                <Select value={selectedCopyType} onValueChange={setSelectedCopyType} >
                                    <SelectTrigger className='hover:border-gray-400'>
                                        <SelectValue placeholder="Choose copy type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Master">Master</SelectItem>
                                        <SelectItem value="Copier">Copier</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full md:w-auto "
                            disabled={loading || selectedAccounts.length === 0 || !selectedCopyType}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit Request'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Recent Requests History */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    {fetchingRequests ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="ml-2">Loading requests...</span>
                        </div>
                    ) : copyRequests.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No copy requests found
                        </div>
                    ) : (
                        <>
                            {/* Table Format */}
                            <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b bg-gray-50 dark:bg-gray-800">
                                            <th className="text-left p-3 font-medium">Date & Time</th>
                                            <th className="text-left p-3 font-medium">Accounts</th>
                                            <th className="text-left p-3 font-medium">Copy Type</th>
                                            <th className="text-left p-3 font-medium">Status</th>
                                            <th className="text-left p-3 font-medium">Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {copyRequests.map((request) => (
                                            <tr key={request._id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                                <td className="p-3">
                                                    <div className="text-sm">
                                                        {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {format(new Date(request.createdAt), 'hh:mm a')}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {request.account ? (
                                                            <div className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                                                {request.account.mt5Account}
                                                            </div>
                                                        ) : (
                                                            (request.accounts || []).map((account, index) => (
                                                                <div key={index} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                                                    {account.mt5Account}
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <Badge variant="outline">{request.copyType}</Badge>
                                                </td>
                                                <td className="p-3">
                                                    {getStatusBadge(request.status)}
                                                </td>
                                                <td className="p-3">
                                                    {request.reason ? (
                                                        <span className="text-red-600 text-sm">{request.reason}</span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-6">
                                    <div className="text-sm text-gray-500">
                                        Page {currentPage} of {totalPages}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1 || fetchingRequests}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages || fetchingRequests}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default CopyRequest;