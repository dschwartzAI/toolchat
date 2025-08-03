#!/usr/bin/env node

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/LibreChat';

async function migrateMemories() {
  console.log('🔄 Starting memory migration...\n');
  
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    // Get memories from old collection
    const memories = await db.collection('memories').find({}).toArray();
    console.log(`Found ${memories.length} memories to migrate`);
    
    if (memories.length === 0) {
      console.log('No memories to migrate');
      return;
    }
    
    // Prepare for migration
    const memoryEntriesToInsert = memories.map(memory => ({
      userId: memory.userId,
      key: memory.key,
      value: memory.value,
      tokenCount: memory.tokenCount || 0,
      updated_at: memory.updatedAt || memory.createdAt || new Date(),
      created_at: memory.createdAt || new Date()
    }));
    
    // Insert into memoryentries collection
    const result = await db.collection('memoryentries').insertMany(memoryEntriesToInsert);
    console.log(`\n✅ Successfully migrated ${result.insertedCount} memories`);
    
    // Show migrated memories
    console.log('\nMigrated memories:');
    memoryEntriesToInsert.forEach(memory => {
      console.log(`  - User: ${memory.userId}`);
      console.log(`    Key: ${memory.key}`);
      console.log(`    Value: ${memory.value.substring(0, 50)}...`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await client.close();
  }
}

migrateMemories().catch(console.error);