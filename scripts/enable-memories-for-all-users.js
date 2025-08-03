#!/usr/bin/env node
/**
 * Migration script to enable memories for all existing users
 * Run this script once to enable the memory feature for all users in the system
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '../LibreChat/.env' });

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/LibreChat';

async function enableMemoriesForAll() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Access the User model directly from mongoose
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
      personalization: {
        type: Object,
        default: {}
      }
    }, { collection: 'users', strict: false }));

    // Update all users to enable memories
    const result = await User.updateMany(
      {},
      { $set: { 'personalization.memories': true } }
    );

    console.log(`Memory feature enabled for ${result.modifiedCount} users`);
    console.log('Migration completed successfully');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

// Run the migration
console.log('Starting memory migration...');
enableMemoriesForAll();