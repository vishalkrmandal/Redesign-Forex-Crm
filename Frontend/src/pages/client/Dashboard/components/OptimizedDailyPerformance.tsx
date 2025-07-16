// Frontend/src/components/client/dashboard/OptimizedDailyPerformance.tsx
import React, { useState } from 'react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    ArrowUpDown,
    UserPlus,
    Activity,
    BarChart3,
    RefreshCw,
    AlertCircle,
    Calendar
} from 'lucide-react';
import { useDailyPerformance } from './useDailyPerformance';

type ChartFilter = 'All' | 'Financial' | 'Users';
type ChartType = 'Line' | 'Area' | 'Mixed';

const OptimizedDailyPerformance: React.FC = () => {
    const [selectedFilter, setSelectedFilter] = useState<ChartFilter>('All');
    const [selectedChartType, setSelectedChartType] = useState<ChartType>('Line');

    const {
        loading,
        error,
        days,
        updateDays,
        refreshData,
        formatCurrency,
        formatNumber,
        formatChange,
        getChangeColor,
        getFilteredData,
        summary,
        changes,
        todayMetrics
    } = useDailyPerformance({
        autoRefresh: true,
        refreshInterval: 60000, // Refresh every minute
        initialDays: 30
    });

    const getChangeIcon = (change: number) => {
        if (change > 0) return <TrendingUp className="w-4 h-4" />;
        if (change < 0) return <TrendingDown className="w-4 h-4" />;
        return null;
    };

    const StatCard = ({
        title,
        value,
        change,
        icon: Icon,
        color,
        bgColor
    }: {
        title: string;
        value: string;
        change: number;
        icon: React.ElementType;
        color: string;
        bgColor: string;
    }) => (
        <div className={`${bgColor} p-4 rounded-lg border-l-4 ${color} transition-all duration-200 hover:shadow-md`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${bgColor.replace('bg-', 'bg-').replace('-50', '-100')}`}>
                        <Icon className={`w-5 h-5 ${color.replace('border-', 'text-')}`} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                    </div>
                </div>
                <div className={`flex items-center gap-1 text-sm ${getChangeColor(change)}`}>
                    {getChangeIcon(change)}
                    <span className="font-medium">{formatChange(change)}</span>
                </div>
            </div>
        </div>
    );

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        {label}
                    </p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {
                                entry.dataKey === 'transactions' ||
                                    entry.dataKey === 'newClients' ||
                                    entry.dataKey === 'ibPartners'
                                    ? formatNumber(entry.value)
                                    : formatCurrency(entry.value)
                            }
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const getVisibleLines = () => {
        const lines = [
            { key: 'deposits', name: 'Deposits', color: '#10B981', show: selectedFilter === 'All' || selectedFilter === 'Financial' },
            { key: 'withdrawals', name: 'Withdrawals', color: '#EF4444', show: selectedFilter === 'All' || selectedFilter === 'Financial' },
            { key: 'transactions', name: 'Transactions', color: '#F59E0B', show: selectedFilter === 'All' || selectedFilter === 'Financial' },
            // { key: 'newClients', name: 'New Clients', color: '#3B82F6', show: selectedFilter === 'All' || selectedFilter === 'Users' },
            // { key: 'ibPartners', name: 'IB Partners', color: '#8B5CF6', show: selectedFilter === 'All' || selectedFilter === 'Users' }
        ];

        return lines.filter(line => line.show);
    };

    // Loading state
    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex items-center justify-center h-96">
                <div className="flex items-center gap-3">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="text-gray-600 dark:text-gray-400">Loading performance data...</span>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex items-center justify-center h-96">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <div className="text-red-500 text-lg mb-2">Failed to load performance data</div>
                    <div className="text-gray-600 dark:text-gray-400 mb-4">{error}</div>
                    <button
                        onClick={refreshData}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!summary || !changes) return null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                            <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Daily Performance Trends
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Last {days} days activity overview
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Filter Buttons */}
                        {(['All', 'Financial'] as ChartFilter[]).map((filter) => ( //user can also add
                            <button
                                key={filter}
                                onClick={() => setSelectedFilter(filter)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedFilter === filter
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {filter}
                            </button>
                        ))}

                        {/* Chart Type Buttons */}
                        {(['Line', 'Area', 'Mixed'] as ChartType[]).map((type) => (
                            <button
                                key={type}
                                onClick={() => setSelectedChartType(type)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedChartType === type
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}

                        {/* Days Filter */}
                        <select
                            value={days}
                            onChange={(e) => updateDays(parseInt(e.target.value))}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={7}>7 Days</option>
                            <option value={14}>14 Days</option>
                            <option value={30}>30 Days</option>
                            <option value={60}>60 Days</option>
                            <option value={90}>90 Days</option>
                        </select>

                        {/* Refresh Button */}
                        <button
                            onClick={refreshData}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Deposits"
                        value={formatCurrency(summary.totalDeposits)}
                        change={changes.deposits}
                        icon={TrendingUp}
                        color="border-green-500"
                        bgColor="bg-green-50 dark:bg-green-900/10"
                    />
                    <StatCard
                        title="Withdrawals"
                        value={formatCurrency(summary.totalWithdrawals)}
                        change={changes.withdrawals}
                        icon={TrendingDown}
                        color="border-red-500"
                        bgColor="bg-red-50 dark:bg-red-900/10"
                    />
                    <StatCard
                        title="Transactions"
                        value={formatNumber(summary.totalTransactions)}
                        change={changes.transactions}
                        icon={ArrowUpDown}
                        color="border-yellow-500"
                        bgColor="bg-yellow-50 dark:bg-yellow-900/10"
                    />
                    {/* <StatCard
                        title="New Clients"
                        value={formatNumber(summary.totalNewClients)}
                        change={changes.newClients}
                        icon={Users}
                        color="border-blue-500"
                        bgColor="bg-blue-50 dark:bg-blue-900/10"
                    /> */}
                    <StatCard
                        title="IB Partners"
                        value={formatNumber(summary.totalIBPartners)}
                        change={changes.ibPartners}
                        icon={UserPlus}
                        color="border-purple-500"
                        bgColor="bg-purple-50 dark:bg-purple-900/10"
                    />
                </div>
            </div>

            {/* Today's Performance Summary */}
            {todayMetrics && (
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Today's Performance
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <p className="text-lg font-bold text-green-600">
                                {formatCurrency(todayMetrics.deposits)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Deposits</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-red-600">
                                {formatCurrency(todayMetrics.withdrawals)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Withdrawals</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-blue-600">
                                {formatNumber(todayMetrics.transactions)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Transactions</p>
                        </div>
                        <div className="text-center">
                            <p className={`text-lg font-bold ${todayMetrics.netFlow >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {formatCurrency(todayMetrics.netFlow)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Net Flow</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Chart */}
            <div className="p-6">
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        {selectedChartType === 'Area' ? (
                            <AreaChart data={getFilteredData(selectedFilter)}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis
                                    dataKey="formattedDate"
                                    className="text-xs"
                                    tick={{ fontSize: 12 }}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    className="text-xs"
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(value) => {
                                        if (selectedFilter === 'Users') return formatNumber(value);
                                        return formatCurrency(value);
                                    }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                {getVisibleLines().map((line, _index) => (
                                    <Area
                                        key={line.key}
                                        type="monotone"
                                        dataKey={line.key}
                                        name={line.name}
                                        stroke={line.color}
                                        fill={line.color}
                                        fillOpacity={0.3}
                                        strokeWidth={2}
                                    />
                                ))}
                            </AreaChart>
                        ) : selectedChartType === 'Mixed' ? (
                            <LineChart data={getFilteredData(selectedFilter)}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis
                                    dataKey="formattedDate"
                                    className="text-xs"
                                    tick={{ fontSize: 12 }}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    className="text-xs"
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(value) => {
                                        if (selectedFilter === 'Users') return formatNumber(value);
                                        return formatCurrency(value);
                                    }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                {getVisibleLines().map((line, _index) => (
                                    <Line
                                        key={line.key}
                                        type="monotone"
                                        dataKey={line.key}
                                        name={line.name}
                                        stroke={line.color}
                                        strokeWidth={line.key === 'deposits' || line.key === 'withdrawals' ? 3 : 2}
                                        dot={{
                                            r: line.key === 'deposits' || line.key === 'withdrawals' ? 6 : 4,
                                            fill: line.color
                                        }}
                                        strokeDasharray={
                                            line.key === 'transactions' || line.key === 'newClients' || line.key === 'ibPartners'
                                                ? "5 5" : "0"
                                        }
                                    />
                                ))}
                            </LineChart>
                        ) : (
                            <LineChart data={getFilteredData(selectedFilter)}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis
                                    dataKey="formattedDate"
                                    className="text-xs"
                                    tick={{ fontSize: 12 }}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    className="text-xs"
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(value) => {
                                        if (selectedFilter === 'Users') return formatNumber(value);
                                        return formatCurrency(value);
                                    }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                {getVisibleLines().map((line, _index) => (
                                    <Line
                                        key={line.key}
                                        type="monotone"
                                        dataKey={line.key}
                                        name={line.name}
                                        stroke={line.color}
                                        strokeWidth={2}
                                        dot={{ r: 4, fill: line.color }}
                                    />
                                ))}
                            </LineChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Chart Legend */}
            {/* <div className="px-6 pb-6">
                <div className="flex flex-wrap justify-center gap-6 text-sm">
                    {getVisibleLines().map((line) => (
                        <div key={line.key} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: line.color }}
                            />
                            <span className="text-gray-600 dark:text-gray-400">{line.name}</span>
                        </div>
                    ))}
                </div>
            </div> */}

            {/* Performance Insights */}
            {/* <div className="px-6 pb-6">
                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                        Performance Insights
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="text-blue-700 dark:text-blue-400">
                                <span className="font-medium">Best Day:</span> Highest deposits occurred on{' '} */}
            {/* This would need to be calculated from the data */}
            {/* recent peak days
                            </p>
                        </div>
                        <div>
                            <p className="text-blue-700 dark:text-blue-400">
                                <span className="font-medium">Trend:</span> {
                                    changes.deposits > 0 ? 'Increasing' :
                                        changes.deposits < 0 ? 'Decreasing' : 'Stable'
                                } deposit activity
                            </p>
                        </div>
                        <div>
                            <p className="text-blue-700 dark:text-blue-400">
                                <span className="font-medium">Net Flow:</span> {
                                    (summary.totalDeposits - summary.totalWithdrawals) >= 0 ? 'Positive' : 'Negative'
                                } cash flow
                            </p>
                        </div>
                    </div>
                </div>
            </div> */}
        </div>
    );
};

export default OptimizedDailyPerformance;