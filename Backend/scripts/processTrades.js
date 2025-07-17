// backend/scripts/processTrades.js
// Utility script to manually process trades
// Usage: node scripts/processTrades.js [startDate] [endDate] [managerIndex]

require('dotenv').config();
const mongoose = require('mongoose');
const { manualProcessTrades } = require('../utils/tradeProcessor');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
};

const main = async () => {
    try {
        await connectDB();

        // Get command line arguments
        const args = process.argv.slice(2);

        // Set default values
        const endTime = args[1] || new Date().toISOString();
        const startTime = args[0] || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const managerIndex = args[2] || process.env.Manager_Index || '3';

        console.log('🚀 Starting manual trade processing...');
        console.log(`📅 Start Time: ${startTime}`);
        console.log(`📅 End Time: ${endTime}`);
        console.log(`👤 Manager Index: ${managerIndex}`);
        console.log('');

        const result = await manualProcessTrades(startTime, endTime, managerIndex);

        console.log('');
        console.log('📊 Processing Results:');
        console.log(`✅ Trades Processed: ${result.processed}`);
        console.log(`💰 Commissions Generated: ${result.commissions}`);
        console.log('');
        console.log('✅ Trade processing completed successfully!');

    } catch (error) {
        console.error('❌ Error processing trades:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('📴 Database connection closed');
        process.exit(0);
    }
};

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n⚠️ Process interrupted');
    await mongoose.disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n⚠️ Process terminated');
    await mongoose.disconnect();
    process.exit(0);
});

// Run the script
main();