// Frontend/src/pages/client/Dashboard/components/DashboardStats.tsx
import React from 'react';
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    CreditCard,
} from 'lucide-react';

interface DashboardStatsProps {
    data: {
        totalBalance: string;
        totalEquity: string;
        totalDeposits: string;
        totalWithdrawals: string;
        totalMt5Accounts: number;
        netBalance: string;
    };
    theme: 'light' | 'dark';
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ data }) => {
    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(parseFloat(amount));
    };

    const statsCards = [
        {
            id: 'balance',
            title: 'Total Balance',
            value: formatCurrency(data.totalBalance),
            icon: Wallet,
            color: 'blue',
            bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30',
            iconColor: 'text-blue-600 dark:text-blue-400',
            valueColor: 'bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-300',
            borderColor: 'hover:border-blue-300 dark:hover:border-blue-600',
            trend: 'up'
        },
        {
            id: 'equity',
            title: 'Total Equity',
            value: formatCurrency(data.totalEquity),
            icon: TrendingUp,
            color: 'indigo',
            bgColor: 'bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
            valueColor: 'bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-400 dark:to-indigo-300',
            borderColor: 'hover:border-indigo-300 dark:hover:border-indigo-600',
            trend: 'up'
        },
        {
            id: 'deposits',
            title: 'Total Deposits',
            value: formatCurrency(data.totalDeposits),
            icon: TrendingUp,
            color: 'green',
            bgColor: 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-800/30',
            iconColor: 'text-green-600 dark:text-green-400',
            valueColor: 'bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-300',
            borderColor: 'hover:border-green-300 dark:hover:border-green-600',
            trend: 'up'
        },
        {
            id: 'withdrawals',
            title: 'Total Withdrawals',
            value: formatCurrency(data.totalWithdrawals),
            icon: TrendingDown,
            color: 'red',
            bgColor: 'bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/30 dark:to-rose-800/30',
            iconColor: 'text-red-600 dark:text-red-400',
            valueColor: 'bg-gradient-to-r from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-300',
            borderColor: 'hover:border-red-300 dark:hover:border-red-600',
            trend: 'down'
        },
        {
            id: 'accounts',
            title: 'MT5 Accounts',
            value: data.totalMt5Accounts.toString(),
            icon: CreditCard,
            color: 'purple',
            bgColor: 'bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/30 dark:to-violet-800/30',
            iconColor: 'text-purple-600 dark:text-purple-400',
            valueColor: 'bg-gradient-to-r from-purple-600 to-violet-600 dark:from-purple-400 dark:to-violet-300',
            borderColor: 'hover:border-purple-300 dark:hover:border-purple-600',
            change: 'Active',
            trend: 'neutral'
        }
    ];

    return (
        <div className="mb-8">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                {statsCards.map((stat) => {
                    const IconComponent = stat.icon;
                    return (
                        <div

                            key={stat.id}
                            className={`group p-4 rounded-2xl border-2 border-transparent ${stat.bgColor} shadow-lg hover:shadow-2xl transition-all duration-300 ${stat.borderColor} hover:-translate-y-2 relative overflow-hidden backdrop-blur-sm`}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-${stat.color}-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-${stat.color}-400 to-${stat.color}-600 rounded-t-2xl`}></div>
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-xm font-medium text-muted-foreground">
                                        {stat.title}
                                    </p>
                                    {/* INSERT THE CONDITIONAL GLOW CODE HERE */}
                                    {stat.id === 'balance' && (
                                        <>
                                            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-t-2xl"></div>
                                        </>
                                    )}
                                    {stat.id === 'equity' && (
                                        <>
                                            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-t-2xl"></div>
                                        </>
                                    )}
                                    {stat.id === 'deposits' && (
                                        <>
                                            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-600 rounded-t-2xl"></div>
                                        </>
                                    )}
                                    {stat.id === 'withdrawals' && (
                                        <>
                                            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-red-600 rounded-t-2xl"></div>
                                        </>
                                    )}
                                    {stat.id === 'accounts' && (
                                        <>
                                            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-purple-600 rounded-t-2xl"></div>
                                        </>
                                    )}

                                    <p className={`text-2xl font-bold mt-3 bg-clip-text text-transparent ${stat.valueColor}`}>
                                        {stat.value}
                                    </p>
                                    {stat.change && (
                                        <div className={`flex items-center mt-2 text-xs ${stat.trend === 'up'
                                            ? 'text-green-500'
                                            : stat.trend === 'down'
                                                ? 'text-red-500'
                                                : 'text-muted-foreground'
                                            }`}>
                                            {stat.trend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
                                            {stat.trend === 'down' && <TrendingDown className="w-3 h-3 mr-1" />}
                                            <span>{stat.change}</span>
                                        </div>
                                    )}
                                </div>
                                <div className={`p-3 rounded-2xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                                    <IconComponent className={`w-6 h-6 ${stat.iconColor}`} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary Card */}
            {/* <div className="p-6 rounded-xl border bg-gradient-to-r from-muted/50 to-muted/30">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-background/50">
                            <PieChart className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Portfolio Overview</h3>
                            <p className="text-sm text-muted-foreground">
                                Total account value including balance and equity
                            </p>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            <span className="text-2xl font-bold text-green-500">
                                {formatCurrency(data.netBalance)}
                            </span>
                        </div>
                        <p className="text-xs mt-1 text-muted-foreground">
                            Net Portfolio Value
                        </p>
                    </div>
                </div>
            </div> */}
        </div>
    );
};

export default DashboardStats;