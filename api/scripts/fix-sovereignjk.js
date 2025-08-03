#!/usr/bin/env node

/**
 * Script to fix SovereignJK agent provider from "groq" to "xai"
 * Run from api directory: node scripts/fix-sovereignjk.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

// MongoDB connection string from .env
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error('Error: MONGO_URI not found in environment variables');
  process.exit(1);
}

// Import the Agent model
const Agent = require('../models/Agent');

async function fixSovereignJKProvider() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected successfully');

    // Find the SovereignJK agent
    const sovereignJK = await Agent.findOne({ 
      agent_id: 'agent_odD3oMA9NgaPXQEcf0Pnq' 
    });

    if (!sovereignJK) {
      console.error('Error: SovereignJK agent not found');
      await mongoose.disconnect();
      return;
    }

    console.log('\nCurrent SovereignJK configuration:');
    console.log(`- Name: ${sovereignJK.name}`);
    console.log(`- Provider: ${sovereignJK.provider}`);
    console.log(`- Model: ${sovereignJK.model}`);

    // Check if already fixed
    if (sovereignJK.provider === 'xai') {
      console.log('\nProvider is already set to "xai". No update needed.');
      await mongoose.disconnect();
      return;
    }

    // Update the provider
    const oldProvider = sovereignJK.provider;
    sovereignJK.provider = 'xai';
    sovereignJK.updatedAt = new Date();
    
    await sovereignJK.save();

    console.log(`\n✅ Successfully updated SovereignJK agent:`);
    console.log(`- Provider changed from "${oldProvider}" to "xai"`);
    console.log(`- Model remains: ${sovereignJK.model}`);

    // Verify the update
    const updated = await Agent.findOne({ 
      agent_id: 'agent_odD3oMA9NgaPXQEcf0Pnq' 
    });
    
    console.log('\nVerification:');
    console.log(`- Provider is now: ${updated.provider}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the fix
fixSovereignJKProvider();