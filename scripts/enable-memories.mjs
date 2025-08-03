#!/usr/bin/env node
/**
 * Simple migration to enable memories for all users
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/LibreChat';

async function enableMemories() {
  console.log('🔄 Enabling memories for all users...\n');
  
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db();
    const users = db.collection('users');
    
    // Count users
    const totalUsers = await users.countDocuments();
    const withMemory = await users.countDocuments({ 'personalization.memories': true });
    
    console.log(`📊 Current state:`);
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Memory enabled: ${withMemory}\n`);
    
    if (totalUsers === 0) {
      console.log('⚠️  No users found. Please register first.\n');
      return;
    }
    
    // Enable memories for all users
    const result = await users.updateMany(
      {},
      { $set: { 'personalization.memories': true } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} users\n`);
    
    // Show sample
    const sample = await users.findOne({ 'personalization.memories': true });
    if (sample) {
      console.log('👤 Sample user:');
      console.log(`   Email: ${sample.email}`);
      console.log(`   Memory enabled: ✅\n`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('✅ Done!\n');
    console.log('🧪 To test memory:');
    console.log('1. Share business info: "My company is XYZ Corp"');
    console.log('2. Start new conversation and ask about your company\n');
  }
}

enableMemories().catch(console.error);