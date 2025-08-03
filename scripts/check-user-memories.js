#!/usr/bin/env node
/**
 * Script to check memories for a specific user
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '../LibreChat/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/LibreChat';
const USER_EMAIL = process.argv[2] || 'dschwartz06@gmail.com';

async function checkUserMemories() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get user
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { collection: 'users', strict: false }));
    const user = await User.findOne({ email: USER_EMAIL }).lean();
    
    if (!user) {
      console.log(`User not found: ${USER_EMAIL}`);
      return;
    }

    console.log(`\nUser: ${user.email}`);
    console.log(`ID: ${user._id}`);
    console.log(`Tier: ${user.tier || 'Not set'}`);
    console.log(`Memories Enabled: ${user.personalization?.memories || false}`);

    // Get memories
    const Memory = mongoose.models.Memory || mongoose.model('Memory', new mongoose.Schema({}, { collection: 'memories', strict: false }));
    const memories = await Memory.find({ userId: user._id }).lean();

    console.log(`\nTotal Memories: ${memories.length}`);
    
    if (memories.length > 0) {
      console.log('\nMemories:');
      memories.forEach((memory, index) => {
        console.log(`\n${index + 1}. Key: ${memory.key}`);
        console.log(`   Value: ${memory.value}`);
        console.log(`   Tokens: ${memory.tokenCount || 0}`);
        console.log(`   Updated: ${new Date(memory.updated_at).toLocaleString()}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

checkUserMemories();