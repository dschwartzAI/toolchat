#!/usr/bin/env node
/**
 * Migration script to enable memories for all users
 * This ensures the memory system is active for existing users
 */

const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection - uses MongoDB Atlas from env
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/LibreChat';

// User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  personalization: {
    memories: { type: Boolean, default: true }
  }
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function enableMemoriesForAllUsers() {
  console.log('🔄 Starting memory enablement migration...\n');
  
  try {
    // Connect to MongoDB
    console.log('📊 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Get current state
    const totalUsers = await User.countDocuments();
    const usersWithMemoryEnabled = await User.countDocuments({ 'personalization.memories': true });
    const usersWithMemoryDisabled = await User.countDocuments({ 'personalization.memories': false });
    const usersWithoutSetting = totalUsers - usersWithMemoryEnabled - usersWithMemoryDisabled;
    
    console.log('📈 Current state:');
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Memory enabled: ${usersWithMemoryEnabled}`);
    console.log(`   Memory disabled: ${usersWithMemoryDisabled}`);
    console.log(`   No setting (default): ${usersWithoutSetting}\n`);
    
    if (totalUsers === 0) {
      console.log('⚠️  No users found in database');
      console.log('   Please create a user account first by registering in LibreChat\n');
      return;
    }
    
    // Enable memories for users who don't have it enabled
    console.log('🔧 Enabling memories for users...');
    
    // Update users with memory explicitly disabled
    const disabledUpdate = await User.updateMany(
      { 'personalization.memories': false },
      { $set: { 'personalization.memories': true } }
    );
    
    // Update users without personalization settings
    const noSettingUpdate = await User.updateMany(
      { personalization: { $exists: false } },
      { $set: { 'personalization.memories': true } }
    );
    
    // Update users with personalization but no memory setting
    const noMemoryUpdate = await User.updateMany(
      { 
        personalization: { $exists: true },
        'personalization.memories': { $exists: false }
      },
      { $set: { 'personalization.memories': true } }
    );
    
    const totalUpdated = disabledUpdate.modifiedCount + noSettingUpdate.modifiedCount + noMemoryUpdate.modifiedCount;
    
    console.log(`✅ Updated ${totalUpdated} users\n`);
    
    // Verify final state
    const finalUsersWithMemory = await User.countDocuments({ 'personalization.memories': true });
    console.log('📊 Final state:');
    console.log(`   Users with memory enabled: ${finalUsersWithMemory}/${totalUsers}`);
    
    // Show sample users
    if (totalUsers > 0) {
      console.log('\n👥 Sample users with memory enabled:');
      const sampleUsers = await User.find({ 'personalization.memories': true })
        .limit(3)
        .select('email name personalization.memories');
      
      sampleUsers.forEach((user, idx) => {
        console.log(`   ${idx + 1}. ${user.email || 'No email'} - Memory: ${user.personalization?.memories ? '✅' : '❌'}`);
      });
    }
    
    console.log('\n✅ Migration complete!');
    console.log('\n💡 Next steps to test memory:');
    console.log('1. Log in to LibreChat');
    console.log('2. Select any agent or assistant');
    console.log('3. Share business information like:');
    console.log('   "My company is ABC Corp and we sell software to enterprises"');
    console.log('   "Our target audience is B2B SaaS companies with 50-500 employees"');
    console.log('4. Start a new conversation and ask about your business');
    console.log('5. The agent should remember your information\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Tip: Make sure MongoDB is running or check your MONGO_URI in .env');
    }
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
}

// Run the migration
enableMemoriesForAllUsers().catch(console.error);