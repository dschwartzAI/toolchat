#!/usr/bin/env node

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/LibreChat';

async function verifyMemory() {
  console.log('🔍 Verifying Memory System\n');
  
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    // Check collections
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name).join(', '));
    
    // Check users
    const users = await db.collection('users').find({}).toArray();
    console.log(`\nUsers: ${users.length}`);
    users.forEach(u => {
      console.log(`  - ${u.email}: memories=${u.personalization?.memories}`);
    });
    
    // Check memories
    const memories = await db.collection('memories').find({}).toArray();
    console.log(`\nMemories: ${memories.length}`);
    memories.forEach(m => {
      console.log(`  - ${m.key}: ${m.value}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

verifyMemory().catch(console.error);