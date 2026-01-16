// Backend\services\accountSyncService.js

const Account = require('../models/client/Account');
const { metaApi } = require('../api/metaApi');
const axios = require('axios');
require('dotenv').config();

class AccountSyncService {
    constructor() {
        this.isRunning = false;
        this.syncInterval = null;
        this.syncStats = {
            lastSyncTime: null,
            successCount: 0,
            errorCount: 0,
            totalAccounts: 0,
            status: 'idle'
        };
    }

    /**
     * Start the automated sync service
     */
    async startAutoSync() {
        if (this.isRunning) {
            console.log('Account sync service is already running');
            return;
        }

        this.isRunning = true;
        console.log('🔄 Starting automated account sync service...');

        // Start continuous sync loop (no initial delay)
        this.continuousSync();
    }

    /**
     * Continuous sync loop that runs immediately after each completion
     */
    async continuousSync() {
        while (this.isRunning) {
            try {
                // Run the sync
                await this.syncAllAccounts();

                // Wait 5 seconds before next sync
                await new Promise(resolve => setTimeout(resolve, 5000));
            } catch (error) {
                console.error('Error in continuous sync loop:', error);
                // Continue even if there's an error
                this.syncStats.errorCount++;

                // Wait 5 seconds even on error before retrying
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    /**
     * Main sync function to update all accounts
     */
    async syncAllAccounts() {
        try {
            this.syncStats.status = 'syncing';
            this.syncStats.lastSyncTime = new Date();

            console.log(`[${new Date().toLocaleString()}] 🔄 Starting account balance sync...`);

            // Fetch all accounts from database
            const accounts = await Account.find({})
                .select('mt5Account managerIndex _id')
                .lean();

            if (accounts.length === 0) {
                console.log('No accounts found to sync');
                this.syncStats.status = 'idle';
                this.syncStats.totalAccounts = 0;
                return;
            }

            this.syncStats.totalAccounts = accounts.length;
            console.log(`Found ${accounts.length} accounts to sync`);

            // Prepare account data for single manager
            const mt5AccountNumbers = accounts.map(acc => parseInt(acc.mt5Account));
            const accountMappings = accounts.map(acc => ({
                mt5Account: parseInt(acc.mt5Account),
                accountId: acc._id
            }));

            console.log(`Syncing ${mt5AccountNumbers.length} accounts`);

            // Call API for single manager
            let updatedCount = 0;
            let errorCount = 0;

            try {
                const managerIndex = process.env.MANAGER_INDEX; // Get from env or default to 3
                const apiUrl = `/GetUserInfoByAccounts`;
                const requestData = {
                    Manager_Index: parseInt(managerIndex),
                    MT5Accounts: mt5AccountNumbers
                };

                const response = await metaApi.post(apiUrl, requestData);

                // Update accounts in database immediately
                if (response.data && Array.isArray(response.data)) {
                    const updatePromises = response.data.map(async (userInfo) => {
                        try {
                            const mt5Account = userInfo.MT5Account || userInfo.Login || userInfo.login;
                            const balance = userInfo.Balance || userInfo.balance || 0;
                            const equity = userInfo.Equity || userInfo.equity || 0;

                            if (mt5Account) {
                                const accountMapping = accountMappings.find(
                                    acc => acc.mt5Account === mt5Account
                                );

                                if (accountMapping) {
                                    await Account.findByIdAndUpdate(
                                        accountMapping.accountId,
                                        {
                                            balance: balance,
                                            equity: equity,
                                            updatedAt: Date.now()
                                        },
                                        { new: true }
                                    );
                                    updatedCount++;
                                    return true;
                                }
                            }
                            return false;
                        } catch (err) {
                            console.error(`Error updating account ${userInfo.MT5Account}:`, err.message);
                            errorCount++;
                            return false;
                        }
                    });

                    // Wait for all updates to complete before restarting
                    await Promise.all(updatePromises);
                }
            } catch (apiError) {
                console.error(`API Error:`, apiError.message);
                errorCount++;
            }

            this.syncStats.successCount++;
            this.syncStats.status = 'idle';

            console.log(`✅ Account sync completed: ${updatedCount} accounts updated, ${errorCount} errors`);
            console.log(`⏳ Waiting 5 seconds before next sync...`);

        } catch (error) {
            console.error('❌ Account sync error:', error.message);
            this.syncStats.errorCount++;
            this.syncStats.status = 'error';
        }
    }

    /**
     * Stop the automated sync service
     */
    stopAutoSync() {
        this.isRunning = false;
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        console.log('⏹️ Account sync service stopped');
    }

    /**
     * Get current sync status
     */
    getSyncStatus() {
        return {
            isRunning: this.isRunning,
            ...this.syncStats
        };
    }
}

// Export singleton instance
module.exports = new AccountSyncService();