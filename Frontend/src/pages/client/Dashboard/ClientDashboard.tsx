// Frontend/src/pages/client/Dashboard/ClientDashboard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import DashboardStats from './components/DashboardStats';
import RecentTransactions from './components/RecentTransactions';
import ActiveAccounts from './components/ActiveAccounts';

import { dashboardApi } from './dashboardApi';
import { useTheme } from '@/context/ThemeContext';
import LoadingSpinner from './components/LoadingSpinner';
// Add these imports after your existing imports
// import PartnerLevelsPieChart from './components/PartnerLevelsPieChart';
// import CommissionEarningsBarChart from './components/CommissionEarningsBarChart';
// import OptimizedFinancialAnalytics from './components/OptimizedFinancialAnalytics';
import OptimizedDailyPerformance from './components/OptimizedDailyPerformance';
import axios from 'axios';



interface DashboardData {
  overview: {
    totalBalance: string;
    totalEquity: string;
    totalDeposits: string;
    totalWithdrawals: string;
    totalMt5Accounts: number;
    netBalance: string;
  };
  recentTransactions: any[];
  activeAccounts: any[];
}

const ClientDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(5);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isRequestInProgress, setIsRequestInProgress] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Add this after your existing state declarations
  // const [partnersData, setPartnersData] = useState<Partner[]>([]);

  // Helper function to trigger account balance update
  const triggerAccountBalanceUpdate = async () => {
    try {
      const token = localStorage.getItem('clientToken');
      const userData = JSON.parse(localStorage.getItem('clientUser') || '{}');
      const userId = userData.id;

      console.log('Token:', token ? 'exists' : 'missing');
      console.log('UserId:', userId);

      if (!token || !userId) return;

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/clients/users/${userId}/accounts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response:', response.data);

    } catch (error) {
      if (error instanceof Error) {
        console.log('Error:', error.message);
      } else {
        console.log('Error:', error);
      }
    }
  };


  // Replace your existing fetchDashboardData function with this:
  const fetchDashboardData = async (showRefreshLoader = false, isAutoRefresh = false) => {
    // Prevent overlapping requests
    if (isRequestInProgress && isAutoRefresh) {
      return;
    }

    try {
      setIsRequestInProgress(true);

      if (showRefreshLoader) {
        setRefreshing(true);
      } else if (!isAutoRefresh) {
        setLoading(true);
      }

      // ADD THIS LINE - only trigger on initial load, not auto-refresh
      if (!isAutoRefresh) {
        triggerAccountBalanceUpdate();
      }

      const [overviewResponse, transactionsResponse, accountsResponse] = await Promise.all([
        dashboardApi.getOverview(),
        dashboardApi.getRecentTransactions(),
        dashboardApi.getActiveAccounts(),
        dashboardApi.getPartners()
      ]);

      setDashboardData({
        overview: overviewResponse.data,
        recentTransactions: transactionsResponse.data.transactions,
        activeAccounts: accountsResponse.data.accounts
      });

      setLastRefresh(new Date());
      setCountdown(5);

      if (showRefreshLoader && !isAutoRefresh) {
        toast.success('Dashboard refreshed successfully');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (!isAutoRefresh) {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsRequestInProgress(false);
    }
  };

  // Format last refresh time
  const formatLastRefresh = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Handle open account navigation
  const handleOpenAccount = () => {
    navigate('/client/account/new');
  };

  // Setup auto-refresh and countdown
  useEffect(() => {
    // Initial load
    fetchDashboardData();

    // Setup auto-refresh - only start new request when previous is complete
    intervalRef.current = setInterval(() => {
      if (!isRequestInProgress) {
        fetchDashboardData(false, true);
      }
    }, 5000);

    // Setup countdown timer
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return 5; // Reset to 5 when it reaches 0
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup intervals on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []); // Empty dependency array - runs only once on mount

  const handleManualRefresh = () => {
    // Clear existing intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    // Fetch data with refresh loader
    fetchDashboardData(true, false);

    // Restart intervals immediately
    intervalRef.current = setInterval(() => {
      if (!isRequestInProgress) {
        fetchDashboardData(false, true);
      }
    }, 5000);

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    // <div className="min-h-screen transition-colors duration-200">

    <div className="container mx-auto px-0 max-w-7xl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-1 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="relative">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Welcome back! Here's your trading overview.
          </p>
        </div>

        <div className="flex flex-col-1 sm:flex-row items-center gap-3">
          {/* Last refresh info */}
          {lastRefresh && (
            <div className="text-xs text-muted-foreground text-center sm:text-right">
              <div>Last updated: {formatLastRefresh(lastRefresh)}</div>
              <div>Next refresh in: {countdown}s</div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {/* Open Account button */}
            <button
              onClick={handleOpenAccount}
              className="flex items-center gap-2 px-6 py-1 rounded-xl font-medium transition-all duration-300 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Open Account</span>
            </button>

            {/* Manual refresh button */}
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      {dashboardData?.overview && (
        <DashboardStats
          data={dashboardData.overview}
          theme={theme}
        />
      )}


      <div className="space-y-6 pb-4">
        {/* Other dashboard components */}
        <OptimizedDailyPerformance />
      </div>

      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"> */}

      {/* Commission Earnings Bar Chart */}
      {/* <CommissionEarningsBarChart
            partners={partnersData}
            theme={theme}
          /> */}

      {/* Partner Levels Pie Chart */}
      {/* <PartnerLevelsPieChart
            partners={partnersData}
            theme={theme}
          />
        </div> */}

      {/* Recent Transactions and Active Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Transactions */}
        <RecentTransactions
          transactions={dashboardData?.recentTransactions || []}
          theme={theme}
          onRefresh={() => fetchDashboardData(true)}
        />

        {/* Active Accounts */}
        <ActiveAccounts
          accounts={dashboardData?.activeAccounts || []}
          theme={theme}
          onRefresh={() => fetchDashboardData(true)}
        />
      </div>
    </div>
    // </div>
  );
};

export default ClientDashboard;