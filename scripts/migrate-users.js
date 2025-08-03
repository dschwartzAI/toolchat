#!/usr/bin/env node

/**
 * User Migration Script for AI Business Tools Platform
 * Imports beta users and sets up tier-based access
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');
const csv = require('csv-parser');
const { createReadStream } = require('fs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../LibreChat/.env') });

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://dschwartz06:6ZMOgKoMsuYVq8Ub@sovereignai.fgbvfyn.mongodb.net/?retryWrites=true&appName=SovereignAI';

// User Schema (extended with business fields)
const userSchema = new mongoose.Schema({
  name: String,
  username: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: String,
  role: { type: String, default: 'user' },
  
  // Business tier system
  tier: {
    type: String,
    enum: ['free', 'premium', 'admin'],
    default: 'free'
  },
  
  // Business metadata
  businessMetadata: {
    company: String,
    industry: String,
    joinedDate: { type: Date, default: Date.now },
    lastToolUsed: String,
    toolUsageCount: { type: Map, of: Number, default: new Map() },
    lastActiveDate: { type: Date, default: Date.now }
  },
  
  // Tier history
  tierHistory: [{
    tier: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: mongoose.Schema.Types.ObjectId,
    reason: String
  }],
  
  // Usage limits
  usageLimits: {
    dailyMessages: Number,
    dailyFileUploads: Number,
    maxConversations: Number
  },
  
  // Current usage
  currentUsage: {
    dailyMessages: {
      count: { type: Number, default: 0 },
      resetAt: { type: Date, default: Date.now }
    },
    dailyFileUploads: {
      count: { type: Number, default: 0 },
      resetAt: { type: Date, default: Date.now }
    }
  },
  
  // Subscription details
  subscription: {
    status: { type: String, default: 'none' },
    startDate: Date,
    endDate: Date,
    autoRenew: { type: Boolean, default: false }
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

// Default tier limits
const TIER_LIMITS = {
  free: {
    dailyMessages: 50,
    dailyFileUploads: 5,
    maxConversations: 10
  },
  premium: {
    dailyMessages: 1000,
    dailyFileUploads: 50,
    maxConversations: 100
  },
  admin: {
    dailyMessages: -1, // Unlimited
    dailyFileUploads: -1,
    maxConversations: -1
  }
};

async function createUser(userData) {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      console.log(`   ⚠️  User ${userData.email} already exists - updating tier to ${userData.tier}`);
      
      // Update existing user's tier
      existingUser.tier = userData.tier;
      existingUser.businessMetadata = {
        ...existingUser.businessMetadata,
        company: userData.company || existingUser.businessMetadata?.company,
        industry: userData.industry || existingUser.businessMetadata?.industry
      };
      existingUser.usageLimits = TIER_LIMITS[userData.tier];
      existingUser.updatedAt = new Date();
      
      if (userData.tier === 'premium') {
        existingUser.subscription = {
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          autoRenew: false
        };
      }
      
      await existingUser.save();
      return { user: existingUser, isNew: false };
    }
    
    // Generate temporary password if not provided
    const tempPassword = userData.password || crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    // Create new user
    const newUser = new User({
      email: userData.email,
      name: userData.name || userData.email.split('@')[0],
      username: userData.username || userData.email.split('@')[0],
      password: hashedPassword,
      tier: userData.tier || 'free',
      role: userData.role || 'user',
      businessMetadata: {
        company: userData.company,
        industry: userData.industry,
        joinedDate: new Date()
      },
      usageLimits: TIER_LIMITS[userData.tier || 'free'],
      tierHistory: [{
        tier: userData.tier || 'free',
        reason: 'Initial migration',
        changedAt: new Date()
      }]
    });
    
    // Set subscription for premium users
    if (userData.tier === 'premium') {
      newUser.subscription = {
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        autoRenew: false
      };
    }
    
    await newUser.save();
    console.log(`   ✅ Created ${userData.tier} user: ${userData.email}`);
    
    return { user: newUser, tempPassword, isNew: true };
  } catch (error) {
    console.error(`   ❌ Failed to create user ${userData.email}:`, error.message);
    throw error;
  }
}

async function importFromCSV(filename) {
  console.log(`📄 Importing users from CSV: ${filename}`);
  
  const users = [];
  const errors = [];
  
  return new Promise((resolve, reject) => {
    createReadStream(filename)
      .pipe(csv())
      .on('data', (row) => {
        users.push({
          email: row.email,
          name: row.name,
          tier: row.tier || 'free',
          company: row.company,
          industry: row.industry,
          role: row.role || 'user'
        });
      })
      .on('end', async () => {
        console.log(`   Found ${users.length} users to import\n`);
        
        const results = {
          created: [],
          updated: [],
          failed: []
        };
        
        for (const userData of users) {
          try {
            const result = await createUser(userData);
            if (result.isNew) {
              results.created.push({
                email: userData.email,
                tempPassword: result.tempPassword
              });
            } else {
              results.updated.push(userData.email);
            }
          } catch (error) {
            results.failed.push({
              email: userData.email,
              error: error.message
            });
          }
        }
        
        resolve(results);
      })
      .on('error', reject);
  });
}

async function createDefaultUsers() {
  console.log('👥 Creating default users...\n');
  
  const defaultUsers = [
    {
      email: process.env.ADMIN_EMAILS?.split(',')[0] || 'admin@example.com',
      name: 'Platform Admin',
      tier: 'admin',
      role: 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123!@#',
      company: 'AI Business Tools',
      industry: 'Technology'
    },
    {
      email: 'premium@example.com',
      name: 'Premium Demo User',
      tier: 'premium',
      company: 'Demo Company',
      industry: 'Consulting'
    },
    {
      email: 'free@example.com',
      name: 'Free Demo User',
      tier: 'free',
      company: 'Startup Inc',
      industry: 'Software'
    }
  ];
  
  const results = {
    created: [],
    updated: [],
    failed: []
  };
  
  for (const userData of defaultUsers) {
    try {
      const result = await createUser(userData);
      if (result.isNew) {
        results.created.push({
          email: userData.email,
          tier: userData.tier,
          tempPassword: result.tempPassword
        });
      } else {
        results.updated.push({
          email: userData.email,
          tier: userData.tier
        });
      }
    } catch (error) {
      results.failed.push({
        email: userData.email,
        error: error.message
      });
    }
  }
  
  return results;
}

async function generateUserReport() {
  console.log('\n📊 Generating user report...');
  
  const report = await User.aggregate([
    {
      $group: {
        _id: '$tier',
        count: { $sum: 1 },
        companies: { $addToSet: '$businessMetadata.company' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
  
  const total = await User.countDocuments();
  
  console.log(`\n📈 User Statistics:`);
  console.log(`   Total Users: ${total}`);
  console.log(`\n   By Tier:`);
  
  report.forEach(tier => {
    console.log(`   - ${tier._id}: ${tier.count} users`);
    if (tier.companies.length > 0 && tier.companies[0]) {
      console.log(`     Companies: ${tier.companies.filter(c => c).slice(0, 5).join(', ')}${tier.companies.length > 5 ? '...' : ''}`);
    }
  });
  
  return report;
}

async function exportCredentials(results, filename = 'user-credentials.csv') {
  if (results.created.length === 0) {
    return;
  }
  
  console.log(`\n📝 Exporting credentials to ${filename}...`);
  
  const csvContent = [
    'email,temporary_password,tier',
    ...results.created.map(u => `${u.email},${u.tempPassword || 'N/A'},${u.tier || 'free'}`)
  ].join('\n');
  
  await fs.writeFile(filename, csvContent);
  console.log(`   ✅ Credentials exported to ${filename}`);
  console.log(`   ⚠️  Share this file securely and delete after distribution!`);
}

async function main() {
  console.log('🚀 AI Business Tools Platform - User Migration');
  console.log('=============================================\n');
  
  const args = process.argv.slice(2);
  const csvFile = args.find(arg => arg.endsWith('.csv'));
  const exportCreds = args.includes('--export-credentials');
  
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB Atlas\n');
    
    let results;
    
    if (csvFile) {
      // Import from CSV
      results = await importFromCSV(csvFile);
    } else {
      // Create default users
      results = await createDefaultUsers();
    }
    
    // Display results
    console.log('\n📋 Migration Results:');
    console.log(`   ✅ Created: ${results.created.length} users`);
    console.log(`   🔄 Updated: ${results.updated.length} users`);
    console.log(`   ❌ Failed: ${results.failed.length} users`);
    
    if (results.failed.length > 0) {
      console.log('\n   Failed users:');
      results.failed.forEach(f => {
        console.log(`   - ${f.email}: ${f.error}`);
      });
    }
    
    // Generate report
    await generateUserReport();
    
    // Export credentials if requested
    if (exportCreds && results.created.length > 0) {
      const timestamp = new Date().toISOString().split('T')[0];
      await exportCredentials(results, `user-credentials-${timestamp}.csv`);
    }
    
    console.log('\n✨ User migration complete!');
    console.log('\nNext steps:');
    console.log('1. Share temporary passwords securely with new users');
    console.log('2. Instruct users to change passwords on first login');
    console.log('3. Monitor user activity in admin panel');
    console.log('4. Set up automated tier management if needed');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Usage instructions
if (require.main === module) {
  if (process.argv.includes('--help')) {
    console.log(`
Usage: node migrate-users.js [options] [csv-file]

Options:
  --export-credentials    Export created user credentials to CSV
  --help                 Show this help message

Examples:
  node migrate-users.js                      # Create default demo users
  node migrate-users.js users.csv            # Import users from CSV
  node migrate-users.js --export-credentials # Create defaults and export credentials
  node migrate-users.js users.csv --export-credentials

CSV Format:
  email,name,tier,company,industry
  john@example.com,John Doe,premium,Acme Corp,Technology
  jane@example.com,Jane Smith,free,Startup Inc,Consulting
    `);
    process.exit(0);
  }
  
  main().catch(console.error);
}

module.exports = {
  createUser,
  importFromCSV,
  createDefaultUsers,
  generateUserReport
};