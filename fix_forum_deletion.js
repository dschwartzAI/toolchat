const mongoose = require('mongoose');
const config = require('./api/config/config');

async function fixForumDeletion() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/librechat');
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Check collections
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Check forumreplies collection
    const repliesCollection = db.collection('forumreplies');
    const count = await repliesCollection.countDocuments();
    console.log('forumreplies count:', count);
    
    // Check sample documents
    const sample = await repliesCollection.findOne({ deletedAt: { $exists: false } });
    console.log('Sample document:', sample?._id);
    
    // Test direct update
    if (sample) {
      const testId = sample._id;
      console.log('Testing update on:', testId);
      
      const result = await repliesCollection.updateOne(
        { _id: testId },
        { $set: { deletedAt: new Date(), deletedBy: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011') } }
      );
      
      console.log('Update result:', result);
      
      // Verify update
      const updated = await repliesCollection.findOne({ _id: testId });
      console.log('Updated document:', updated);
    }
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixForumDeletion();
