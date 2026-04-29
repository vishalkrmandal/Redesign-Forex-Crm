// backend/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 100,                    // Increased for 50K users
      minPoolSize: 10,                     // Keep more ready connections
      serverSelectionTimeoutMS: 5000,      // Keep - fail fast
      socketTimeoutMS: 45000,              // Keep - prevent hanging
      retryWrites: true,                   // Keep - handle network issues
      // w: 'majority',                    // Remove - useless with single server
      // readPreference: 'primary',        // Remove - only one server
      heartbeatFrequencyMS: 10000,         // Keep - health monitoring
      maxIdleTimeMS: 30000,                // Add - close idle connections
      connectTimeoutMS: 10000,
    });
    console.log(`MongoDB Connected to database: ${conn.connection.name}`);
    console.log(`Host: ${conn.connection.host}`);
    console.log(`Port: ${conn.connection.port}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};


// Add after your connection code
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err.message);
});

// // Handle cleanup on process termination
// process.on('SIGINT', async () => {
//   await syncManager.close();
//   await mongoose.connection.close();
//   process.exit(0);
// });

module.exports = connectDB;
