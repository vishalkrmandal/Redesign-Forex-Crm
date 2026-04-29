// Backend/controllers/client/dailyPerformanceController.js
const User = require('../../models/User');
const Account = require('../../models/client/Account');
const Deposit = require('../../models/Deposit');
const Withdrawal = require('../../models/Withdrawal');
const Transfer = require('../../models/client/Transfer');
const IBClosedTrades = require('../../models/IBClosedTrade');
const mongoose = require('mongoose');

/**
 * Get daily performance trends data for the last 30 days
 */
const getDailyPerformanceTrends = async (req, res) => {
    try {
        const userId = req.user.id;
        const { days = 30 } = req.query;

        // Calculate date range - last X days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - parseInt(days));

        // Get user accounts
        const userAccounts = await Account.find({ user: userId }).select('_id mt5Account');
        const accountIds = userAccounts.map(account => account._id);
        const mt5Accounts = userAccounts.map(account => account.mt5Account);

        // Helper function to generate date series
        const generateDateSeries = (start, end) => {
            const dates = [];
            const current = new Date(start);

            while (current <= end) {
                dates.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }
            return dates;
        };

        const dateSeries = generateDateSeries(startDate, endDate);

        // Get deposits data by day
        const depositsData = await Deposit.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId),
                    account: { $in: accountIds },
                    status: 'Approved',
                    approvedDate: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$approvedDate"
                        }
                    },
                    amount: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Get withdrawals data by day
        const withdrawalsData = await Withdrawal.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId),
                    account: { $in: accountIds },
                    status: 'Approved',
                    approvedDate: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$approvedDate"
                        }
                    },
                    amount: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Get transactions (transfers) data by day
        const transactionsData = await Transfer.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId),
                    $or: [
                        { fromAccount: { $in: accountIds } },
                        { toAccount: { $in: accountIds } }
                    ],
                    status: 'Completed',
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Get trading P&L data by day
        const tradingData = await IBClosedTrades.aggregate([
            {
                $match: {
                    mt5Account: { $in: mt5Accounts },
                    closeTime: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$closeTime"
                        }
                    },
                    profit: { $sum: "$profit" },
                    commission: { $sum: "$commission" },
                    swap: { $sum: "$swap" },
                    trades: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Get new clients count (if user is IB partner - this would be referrals)
        // For regular clients, this might be new accounts created
        const newAccountsData = await Account.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId),
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Create data maps for easier lookup
        const depositsMap = new Map(depositsData.map(d => [d._id, d]));
        const withdrawalsMap = new Map(withdrawalsData.map(d => [d._id, d]));
        const transactionsMap = new Map(transactionsData.map(d => [d._id, d]));
        const tradingMap = new Map(tradingData.map(d => [d._id, d]));
        const newAccountsMap = new Map(newAccountsData.map(d => [d._id, d]));

        // Generate daily chart data
        const chartData = dateSeries.map(date => {
            const dateStr = date.toISOString().split('T')[0];
            const deposits = depositsMap.get(dateStr) || { amount: 0, count: 0 };
            const withdrawals = withdrawalsMap.get(dateStr) || { amount: 0, count: 0 };
            const transactions = transactionsMap.get(dateStr) || { count: 0 };
            const trading = tradingMap.get(dateStr) || { profit: 0, commission: 0, swap: 0, trades: 0 };
            const newAccounts = newAccountsMap.get(dateStr) || { count: 0 };

            return {
                date: dateStr,
                formattedDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                deposits: parseFloat(deposits.amount.toFixed(2)),
                withdrawals: parseFloat(withdrawals.amount.toFixed(2)),
                transactions: transactions.count,
                tradingPnL: parseFloat((trading.profit + trading.commission + trading.swap).toFixed(2)),
                newClients: newAccounts.count,
                ibPartners: 0, // This would need additional logic for IB partner relationships
                depositsCount: deposits.count,
                withdrawalsCount: withdrawals.count,
                tradesCount: trading.trades
            };
        });

        // Calculate summary totals for the period
        const summary = {
            totalDeposits: depositsData.reduce((sum, d) => sum + d.amount, 0),
            totalWithdrawals: withdrawalsData.reduce((sum, d) => sum + d.amount, 0),
            totalTransactions: transactionsData.reduce((sum, d) => sum + d.count, 0),
            totalTradingPnL: tradingData.reduce((sum, d) => sum + d.profit + d.commission + d.swap, 0),
            totalNewClients: newAccountsData.reduce((sum, d) => sum + d.count, 0),
            totalIBPartners: 0, // Would need additional logic
            depositsCount: depositsData.reduce((sum, d) => sum + d.count, 0),
            withdrawalsCount: withdrawalsData.reduce((sum, d) => sum + d.count, 0),
            totalTrades: tradingData.reduce((sum, d) => sum + d.trades, 0)
        };

        // Calculate percentage changes (comparing with previous period)
        const previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - parseInt(days));

        // Get previous period data for comparison
        const previousDeposits = await Deposit.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId),
                    account: { $in: accountIds },
                    status: 'Approved',
                    approvedDate: { $gte: previousStartDate, $lt: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);

        const previousWithdrawals = await Withdrawal.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId),
                    account: { $in: accountIds },
                    status: 'Approved',
                    approvedDate: { $gte: previousStartDate, $lt: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);

        const previousTransactions = await Transfer.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId),
                    $or: [
                        { fromAccount: { $in: accountIds } },
                        { toAccount: { $in: accountIds } }
                    ],
                    status: 'Completed',
                    createdAt: { $gte: previousStartDate, $lt: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 }
                }
            }
        ]);

        const previousTrading = await IBClosedTrades.aggregate([
            {
                $match: {
                    mt5Account: { $in: mt5Accounts },
                    closeTime: { $gte: previousStartDate, $lt: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    profit: { $sum: "$profit" },
                    commission: { $sum: "$commission" },
                    swap: { $sum: "$swap" }
                }
            }
        ]);

        // Calculate changes
        const prevDeposits = previousDeposits[0]?.total || 0;
        const prevWithdrawals = previousWithdrawals[0]?.total || 0;
        const prevTransactions = previousTransactions[0]?.count || 0;
        const prevTrading = previousTrading[0] ?
            (previousTrading[0].profit + previousTrading[0].commission + previousTrading[0].swap) : 0;

        const changes = {
            deposits: prevDeposits > 0 ? ((summary.totalDeposits - prevDeposits) / prevDeposits * 100) : 0,
            withdrawals: prevWithdrawals > 0 ? ((summary.totalWithdrawals - prevWithdrawals) / prevWithdrawals * 100) : 0,
            transactions: prevTransactions > 0 ? ((summary.totalTransactions - prevTransactions) / prevTransactions * 100) : 0,
            tradingPnL: prevTrading !== 0 ? ((summary.totalTradingPnL - prevTrading) / Math.abs(prevTrading) * 100) : 0,
            newClients: 0, // Would need historical data
            ibPartners: 0
        };

        res.status(200).json({
            success: true,
            data: {
                chartData,
                summary,
                changes,
                period: `${days} days`,
                dateRange: {
                    start: startDate.toISOString(),
                    end: endDate.toISOString()
                }
            }
        });

    } catch (error) {
        console.error('Daily performance trends error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch daily performance trends',
            error: error.message
        });
    }
};

/**
 * Get real-time performance summary for today
 */
const getTodayPerformance = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get today's date range
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        // Get user accounts
        const userAccounts = await Account.find({ user: userId }).select('_id mt5Account');
        const accountIds = userAccounts.map(account => account._id);
        const mt5Accounts = userAccounts.map(account => account.mt5Account);

        // Get today's data
        const [todayDeposits, todayWithdrawals, todayTransfers, todayTrades] = await Promise.all([
            Deposit.aggregate([
                {
                    $match: {
                        user: new mongoose.Types.ObjectId(userId),
                        account: { $in: accountIds },
                        status: 'Approved',
                        approvedDate: { $gte: startOfDay, $lt: endOfDay }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$amount" },
                        count: { $sum: 1 }
                    }
                }
            ]),
            Withdrawal.aggregate([
                {
                    $match: {
                        user: new mongoose.Types.ObjectId(userId),
                        account: { $in: accountIds },
                        status: 'Approved',
                        approvedDate: { $gte: startOfDay, $lt: endOfDay }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$amount" },
                        count: { $sum: 1 }
                    }
                }
            ]),
            Transfer.aggregate([
                {
                    $match: {
                        user: new mongoose.Types.ObjectId(userId),
                        $or: [
                            { fromAccount: { $in: accountIds } },
                            { toAccount: { $in: accountIds } }
                        ],
                        status: 'Completed',
                        createdAt: { $gte: startOfDay, $lt: endOfDay }
                    }
                },
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 }
                    }
                }
            ]),
            IBClosedTrades.aggregate([
                {
                    $match: {
                        mt5Account: { $in: mt5Accounts },
                        closeTime: { $gte: startOfDay, $lt: endOfDay }
                    }
                },
                {
                    $group: {
                        _id: null,
                        profit: { $sum: "$profit" },
                        commission: { $sum: "$commission" },
                        swap: { $sum: "$swap" },
                        trades: { $sum: 1 }
                    }
                }
            ])
        ]);

        const todaySummary = {
            deposits: todayDeposits[0]?.total || 0,
            withdrawals: todayWithdrawals[0]?.total || 0,
            transactions: todayTransfers[0]?.count || 0,
            tradingPnL: todayTrades[0] ?
                (todayTrades[0].profit + todayTrades[0].commission + todayTrades[0].swap) : 0,
            trades: todayTrades[0]?.trades || 0,
            depositsCount: todayDeposits[0]?.count || 0,
            withdrawalsCount: todayWithdrawals[0]?.count || 0
        };

        res.status(200).json({
            success: true,
            data: {
                today: todaySummary,
                date: today.toISOString().split('T')[0]
            }
        });

    } catch (error) {
        console.error('Today performance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch today performance',
            error: error.message
        });
    }
};

module.exports = {
    getDailyPerformanceTrends,
    getTodayPerformance
};