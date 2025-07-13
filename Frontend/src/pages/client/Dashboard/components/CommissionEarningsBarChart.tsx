// Frontend/src/pages/client/Dashboard/components/CommissionEarningsBarChart.tsx
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, Calendar, Filter, TrendingUp } from 'lucide-react';

interface Partner {
    _id: string;
    userId: {
        _id: string;
        firstname: string;
        lastname: string;
        email: string;
    };
    referralCode: string | null;
    level: number;
    totalVolume: number;
    totalEarned: number;
    createdAt: string;
}

interface CommissionEarningsBarChartProps {
    partners: Partner[];
    theme: 'light' | 'dark';
}

const LEVEL_COLORS = [
    '#3B82F6', // Blue - Level 1
    '#10B981', // Green - Level 2
    '#F59E0B', // Yellow - Level 3
    '#EF4444', // Red - Level 4
    '#8B5CF6', // Purple - Level 5
    '#F97316', // Orange - Level 6
    '#EC4899', // Pink - Level 7
    '#06B6D4', // Cyan - Level 8
];

const CommissionEarningsBarChart: React.FC<CommissionEarningsBarChartProps> = ({ partners, theme }) => {
    const [dateRange, setDateRange] = useState<'1m' | '3m' | '6m' | '1y' | 'all'>('6m');
    const [selectedLevels, setSelectedLevels] = useState<number[]>([]);

    // Get unique levels from partners
    const availableLevels = useMemo(() => {
        const levels = [...new Set(partners.map(p => p.level))].sort((a, b) => a - b);
        return levels;
    }, [partners]);

    // Initialize selected levels with all available levels
    React.useEffect(() => {
        if (selectedLevels.length === 0 && availableLevels.length > 0) {
            setSelectedLevels(availableLevels);
        }
    }, [availableLevels, selectedLevels.length]);

    const chartData = useMemo(() => {
        const now = new Date();
        let startDate = new Date();

        switch (dateRange) {
            case '1m':
                startDate = new Date(now);
                startDate.setMonth(now.getMonth() - 1);
                break;
            case '3m':
                startDate = new Date(now);
                startDate.setMonth(now.getMonth() - 3);
                break;
            case '6m':
                startDate = new Date(now);
                startDate.setMonth(now.getMonth() - 6);
                break;
            case '1y':
                startDate = new Date(now);
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            case 'all':
                startDate = new Date(0); // Beginning of time
                break;
        }

        // Filter partners by date range
        const filteredPartners = partners.filter(partner => {
            const partnerDate = new Date(partner.createdAt);
            return partnerDate >= startDate;
        });

        // Group by level and month for detailed breakdown
        const levelData: Record<number, { total: number; monthlyBreakdown: Record<string, number> }> = {};

        filteredPartners.forEach(partner => {
            if (!selectedLevels.includes(partner.level)) return;

            const date = new Date(partner.createdAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!levelData[partner.level]) {
                levelData[partner.level] = { total: 0, monthlyBreakdown: {} };
            }

            levelData[partner.level].total += partner.totalEarned;

            if (!levelData[partner.level].monthlyBreakdown[monthKey]) {
                levelData[partner.level].monthlyBreakdown[monthKey] = 0;
            }
            levelData[partner.level].monthlyBreakdown[monthKey] += partner.totalEarned;
        });

        // Convert to chart format - one entry per level
        return selectedLevels.map(level => ({
            level: `Level ${level}`,
            levelNumber: level,
            total: levelData[level]?.total || 0,
            monthlyBreakdown: levelData[level]?.monthlyBreakdown || {}
        }));
    }, [partners, dateRange, selectedLevels]);

    const totalEarnings = useMemo(() => {
        return chartData.reduce((total, levelData) => total + levelData.total, 0);
    }, [chartData]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const monthlyBreakdown = data.monthlyBreakdown;
            const monthEntries = Object.entries(monthlyBreakdown).sort(([a], [b]) => a.localeCompare(b));

            return (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
                    <p className="text-lg font-bold mb-3" style={{ color: payload[0].color }}>
                        Total: ${data.total.toFixed(2)}
                    </p>

                    {monthEntries.length > 0 && (
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                            <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 font-medium">Monthly Breakdown:</p>
                            {monthEntries.map(([month, amount]) => (
                                <p key={month} className="text-xs text-gray-700 dark:text-gray-300">
                                    {month}: <span className="font-semibold">${(amount as number).toFixed(2)}</span>
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    const handleLevelToggle = (level: number) => {
        setSelectedLevels(prev =>
            prev.includes(level)
                ? prev.filter(l => l !== level)
                : [...prev, level].sort((a, b) => a - b)
        );
    };

    if (partners.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Commission Earnings by Level
                    </h3>
                </div>

                <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                    <DollarSign className="w-16 h-16 mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-2">No Commission Data</p>
                    <p className="text-sm text-center">
                        Commission earnings will appear here once your partners start trading
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Commission Earnings by Level
                    </h3>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-medium">Total: ${totalEarnings.toFixed(2)}</span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {/* Date Range Filter */}
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value as any)}
                        className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="1m">Last 1 Month</option>
                        <option value="3m">Last 3 Months</option>
                        <option value="6m">Last 6 Months</option>
                        <option value="1y">Last Year</option>
                        <option value="all">All Time</option>
                    </select>
                </div>

                {/* Level Filter */}
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <div className="flex flex-wrap gap-2">
                        {availableLevels.map(level => (
                            <button
                                key={level}
                                onClick={() => handleLevelToggle(level)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${selectedLevels.includes(level)
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                                    }`}
                                style={{
                                    backgroundColor: selectedLevels.includes(level)
                                        ? LEVEL_COLORS[level % LEVEL_COLORS.length]
                                        : undefined
                                }}
                            >
                                Level {level}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                        <XAxis
                            dataKey="level"
                            stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                            fontSize={12}
                        />
                        <YAxis
                            stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                            fontSize={12}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                            dataKey="total"
                            radius={[4, 4, 0, 0]}
                            fill="#3B82F6"
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={LEVEL_COLORS[entry.levelNumber % LEVEL_COLORS.length]}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Summary Stats */}
            <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-all duration-300 hover:shadow-md">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Avg per Level</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                        ${chartData.length > 0 ? (totalEarnings / chartData.length).toFixed(2) : '0.00'}
                    </p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-all duration-300 hover:shadow-md">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Top Level</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                        ${chartData.length > 0 ? Math.max(...chartData.map(d => d.total)).toFixed(2) : '0.00'}
                    </p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-all duration-300 hover:shadow-md">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Active Levels</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {selectedLevels.length}
                    </p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-all duration-300 hover:shadow-md">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Total Period</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        ${totalEarnings.toFixed(2)}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default CommissionEarningsBarChart;