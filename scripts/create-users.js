/**
 * Create initial users for AI Business Tools Platform
 * Run this inside the LibreChat container
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://dschwartz06:6ZMOgKoMsuYVq8Ub@sovereignai.fgbvfyn.mongodb.net/?retryWrites=true&appName=SovereignAI';

// User schema (simplified version)
const userSchema = new mongoose.Schema({
  name: String,
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  tier: { type: String, enum: ['free', 'premium', 'admin'], default: 'free' },
  company: String,
  role: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB Atlas');

    // Admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = {
      name: 'Admin User',
      username: 'admin',
      email: 'admin@jkai.com',
      password: adminPassword,
      tier: 'admin',
      company: 'JKAI',
      role: 'Administrator'
    };

    // Regular premium user
    const userPassword = await bcrypt.hash('user123', 10);
    const regularUser = {
      name: 'John Business',
      username: 'john',
      email: 'john@example.com',
      password: userPassword,
      tier: 'premium',
      company: 'Example Corp',
      role: 'Business Owner'
    };

    // Create or update admin
    await User.findOneAndUpdate(
      { email: adminUser.email },
      adminUser,
      { upsert: true, new: true }
    );
    console.log('✅ Admin user created/updated:');
    console.log('   Email: admin@jkai.com');
    console.log('   Password: admin123');

    // Create or update regular user
    await User.findOneAndUpdate(
      { email: regularUser.email },
      regularUser,
      { upsert: true, new: true }
    );
    console.log('\n✅ Premium user created/updated:');
    console.log('   Email: john@example.com');
    console.log('   Password: user123');

    console.log('\n🎉 Users created successfully!');
    console.log('You can now log in at http://localhost:3081');
    
  } catch (error) {
    console.error('Error creating users:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createUsers();