// Frontend/src/hooks/useDailyPerformance.ts
import { useState, useEffect, useCallback } from 'react';

interface DailyData {
    date: string;
    formattedDate: string;
    deposits: number;
    withdrawals: number;
    transactions: number;
    tradingPnL: number;
    newClients: number;
    ibPartners: number;
    depositsCount: number;
    withdrawalsCount: number;
    tradesCount: number;
}

interface Summary {
    totalDeposits: number;
    totalWithdrawals: number;
    totalTransactions: number;
    totalTradingPnL: number;
    totalNewClients: number;
    totalIBPartners: number;
    depositsCount: number;
    withdrawalsCount: number;
    totalTrades: number;
}

interface Changes {
    deposits: number;
    withdrawals: number;
    transactions: number;
    tradingPnL: number;
    newClients: number;
    ibPartners: number;
}

interface PerformanceData {
    chartData: DailyData[];
    summary: Summary;
    changes: Changes;
    period: string;
    dateRange: {
        start: string;
        end: string;
    };
}

interface TodayPerformance {
    deposits: number;
    withdrawals: number;
    transactions: number;
    tradingPnL: number;
    trades: number;
    depositsCount: number;
    withdrawalsCount: number;
}

interface UseDailyPerformanceOptions {
    autoRefresh?: boolean;
    refreshInterval?: number; // in milliseconds
    initialDays?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useDailyPerformance = (options: UseDailyPerformanceOptions = {}) => {
    const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
    const [todayData, setTodayData] = useState<TodayPerformance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [days, setDays] = useState(options.initialDays || 30);

    const { autoRefresh = false, refreshInterval = 60000 } = options;

    // Fetch performance trends data
    const fetchPerformanceData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${API_BASE_URL}/api/daily-performance/trends?days=${days}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('clientToken')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch performance data');
            }

            const result = await response.json();
            setPerformanceData(result.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch performance data');
        } finally {
            setLoading(false);
        }
    }, [days]);

    // Fetch today's performance data
    const fetchTodayData = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/daily-performance/today`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('clientToken')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch today data');
            }

            const result = await response.json();
            setTodayData(result.data.today);
        } catch (err) {
            console.error('Failed to fetch today data:', err);
        }
    }, []);

    // Fetch all data
    const fetchAllData = useCallback(async () => {
        await Promise.all([
            fetchPerformanceData(),
            fetchTodayData()
        ]);
    }, [fetchPerformanceData, fetchTodayData]);

    // Update days and refetch data
    const updateDays = useCallback((newDays: number) => {
        setDays(newDays);
    }, []);

    // Manual refresh
    const refreshData = useCallback(() => {
        fetchAllData();
    }, [fetchAllData]);

    // Initial data fetch
    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    // Auto-refresh setup
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            fetchAllData();
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, fetchAllData]);

    // Refetch when days change
    useEffect(() => {
        fetchPerformanceData();
    }, [days, fetchPerformanceData]);

    // Utility functions
    const formatCurrency = useCallback((value: number) => {
        if (Math.abs(value) >= 1000000) {
            return `$${(value / 1000000).toFixed(1)}M`;
        } else if (Math.abs(value) >= 1000) {
            return `$${(value / 1000).toFixed(1)}K`;
        }
        return `$${value.toLocaleString()}`;
    }, []);

    const formatNumber = useCallback((value: number) => {
        return value.toLocaleString();
    }, []);

    const formatChange = useCallback((change: number) => {
        const sign = change >= 0 ? '+' : '';
        return `${sign}${change.toFixed(1)}%`;
    }, []);

    const getChangeColor = useCallback((change: number) => {
        if (change > 0) return 'text-green-600';
        if (change < 0) return 'text-red-600';
        return 'text-gray-600';
    }, []);

    // Calculate performance metrics
    const metrics = performanceData ? {
        totalValue: performanceData.summary.totalDeposits - performanceData.summary.totalWithdrawals,
        netFlow: performanceData.summary.totalDeposits - performanceData.summary.totalWithdrawals,
        averageDaily: {
            deposits: performanceData.summary.totalDeposits / days,
            withdrawals: performanceData.summary.totalWithdrawals / days,
            transactions: performanceData.summary.totalTransactions / days,
            tradingPnL: performanceData.summary.totalTradingPnL / days
        },
        growthRates: {
            deposits: performanceData.changes.deposits,
            withdrawals: performanceData.changes.withdrawals,
            transactions: performanceData.changes.transactions,
            tradingPnL: performanceData.changes.tradingPnL
        }
    } : null;

    // Filter data by category
    const getFilteredData = useCallback((filter: 'All' | 'Financial' | 'Users') => {
        if (!performanceData) return [];

        switch (filter) {
            case 'Financial':
                return performanceData.chartData.map(item => ({
                    ...item,
                    newClients: undefined,
                    ibPartners: undefined
                }));
            case 'Users':
                return performanceData.chartData.map(item => ({
                    ...item,
                    deposits: undefined,
                    withdrawals: undefined,
                    tradingPnL: undefined
                }));
            default:
                return performanceData.chartData;
        }
    }, [performanceData]);

    // Get summary for specific period
    const getPeriodSummary = useCallback((startDate: string, endDate: string) => {
        if (!performanceData) return null;

        const filteredData = performanceData.chartData.filter(
            item => item.date >= startDate && item.date <= endDate
        );

        return {
            totalDeposits: filteredData.reduce((sum, item) => sum + item.deposits, 0),
            totalWithdrawals: filteredData.reduce((sum, item) => sum + item.withdrawals, 0),
            totalTransactions: filteredData.reduce((sum, item) => sum + item.transactions, 0),
            totalTradingPnL: filteredData.reduce((sum, item) => sum + item.tradingPnL, 0),
            totalNewClients: filteredData.reduce((sum, item) => sum + item.newClients, 0),
            totalTrades: filteredData.reduce((sum, item) => sum + item.tradesCount, 0),
            days: filteredData.length
        };
    }, [performanceData]);

    // Get top performing days
    const getTopPerformingDays = useCallback((metric: keyof DailyData, count: number = 5) => {
        if (!performanceData) return [];

        return [...performanceData.chartData]
            .sort((a, b) => (b[metric] as number) - (a[metric] as number))
            .slice(0, count)
            .map(item => ({
                date: item.formattedDate,
                value: item[metric],
                fullData: item
            }));
    }, [performanceData]);

    return {
        // Data
        performanceData,
        todayData,
        metrics,

        // State
        loading,
        error,
        days,

        // Actions
        updateDays,
        refreshData,
        fetchPerformanceData,
        fetchTodayData,

        // Utilities
        formatCurrency,
        formatNumber,
        formatChange,
        getChangeColor,
        getFilteredData,
        getPeriodSummary,
        getTopPerformingDays,

        // Computed values
        summary: performanceData?.summary,
        changes: performanceData?.changes,
        chartData: performanceData?.chartData,
        dateRange: performanceData?.dateRange,

        // Quick access to today's metrics
        todayMetrics: todayData ? {
            deposits: todayData.deposits,
            withdrawals: todayData.withdrawals,
            netFlow: todayData.deposits - todayData.withdrawals,
            transactions: todayData.transactions,
            tradingPnL: todayData.tradingPnL,
            trades: todayData.trades
        } : null
    };
};

export default useDailyPerformance;