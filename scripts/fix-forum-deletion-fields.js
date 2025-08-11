#!/usr/bin/env node
/**
 * Script to check and fix inconsistent deletion fields in forum replies
 * Run with: node scripts/fix-forum-deletion-fields.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function fixDeletionFields() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI not found in environment variables');
    }
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    // Get the ForumReply collection
    const db = mongoose.connection.db;
    const repliesCollection = db.collection('forumreplies');
    
    // Find all replies with inconsistent deletion fields
    console.log('\n=== Checking for inconsistent deletion fields ===');
    
    // Find replies with isDeleted field
    const withIsDeleted = await repliesCollection.find({ 
      isDeleted: { $exists: true } 
    }).toArray();
    
    console.log(`Found ${withIsDeleted.length} replies with 'isDeleted' field`);
    
    // Find replies with deleted_at field
    const withDeletedAt = await repliesCollection.find({ 
      deleted_at: { $exists: true } 
    }).toArray();
    
    console.log(`Found ${withDeletedAt.length} replies with 'deleted_at' field`);
    
    // Find replies with deletedAt field
    const withCorrectField = await repliesCollection.find({ 
      deletedAt: { $exists: true } 
    }).toArray();
    
    console.log(`Found ${withCorrectField.length} replies with correct 'deletedAt' field`);
    
    // Fix inconsistent fields
    if (withIsDeleted.length > 0) {
      console.log('\n=== Fixing isDeleted fields ===');
      for (const reply of withIsDeleted) {
        const updateData = {};
        
        // If isDeleted is true, set deletedAt to current date
        if (reply.isDeleted === true) {
          updateData.deletedAt = reply.deletedAt || new Date();
        }
        
        // Remove the old field
        await repliesCollection.updateOne(
          { _id: reply._id },
          { 
            $set: updateData,
            $unset: { isDeleted: '' }
          }
        );
        
        console.log(`Fixed reply ${reply._id}: isDeleted=${reply.isDeleted} -> deletedAt=${updateData.deletedAt || null}`);
      }
    }
    
    if (withDeletedAt.length > 0) {
      console.log('\n=== Fixing deleted_at fields ===');
      for (const reply of withDeletedAt) {
        // Rename deleted_at to deletedAt
        await repliesCollection.updateOne(
          { _id: reply._id },
          { 
            $rename: { 'deleted_at': 'deletedAt' }
          }
        );
        
        console.log(`Fixed reply ${reply._id}: renamed deleted_at to deletedAt`);
      }
    }
    
    // Verify the fixes
    console.log('\n=== Verification ===');
    const totalReplies = await repliesCollection.countDocuments({});
    const deletedReplies = await repliesCollection.countDocuments({ 
      deletedAt: { $ne: null } 
    });
    const activeReplies = await repliesCollection.countDocuments({ 
      deletedAt: null 
    });
    
    console.log(`Total replies: ${totalReplies}`);
    console.log(`Deleted replies: ${deletedReplies}`);
    console.log(`Active replies: ${activeReplies}`);
    
    // Check for any remaining inconsistent fields
    const stillHasOldFields = await repliesCollection.find({
      $or: [
        { isDeleted: { $exists: true } },
        { deleted_at: { $exists: true } }
      ]
    }).toArray();
    
    if (stillHasOldFields.length > 0) {
      console.log(`\n⚠️  Warning: ${stillHasOldFields.length} replies still have old deletion fields`);
    } else {
      console.log('\n✅ All deletion fields have been standardized to use "deletedAt"');
    }
    
    // Close connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
fixDeletionFields().then(() => {
  console.log('\n✅ Script completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});