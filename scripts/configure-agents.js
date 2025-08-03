#!/usr/bin/env node

/**
 * Agent Configuration Script for AI Business Tools Platform
 * Sets up Dark JK Coach and Hybrid Offer Creator agents in LibreChat
 */

const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../LibreChat/.env') });

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://dschwartz06:6ZMOgKoMsuYVq8Ub@sovereignai.fgbvfyn.mongodb.net/?retryWrites=true&appName=SovereignAI';

// Agent Schema (matching LibreChat's structure)
const agentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  instructions: String,
  model: String,
  provider: String,
  temperature: { type: Number, default: 0.7 },
  max_completion_tokens: Number,
  response_format: Object,
  tools: [Object],
  tool_resources: Object,
  metadata: Object,
  welcomeMessage: String,
  conversationFlow: Object,
  settings: Object,
  completionMessage: String,
  editingInstructions: String,
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'assistants' }); // LibreChat stores agents in assistants collection

const Agent = mongoose.model('Agent', agentSchema);

async function loadConfig(filename) {
  try {
    const configPath = path.join(__dirname, '..', filename);
    const content = await fs.readFile(configPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error.message);
    throw error;
  }
}

async function loadPrompt(filename) {
  try {
    const promptPath = path.join(__dirname, '..', filename);
    return await fs.readFile(promptPath, 'utf8');
  } catch (error) {
    console.error(`Error loading ${filename}:`, error.message);
    throw error;
  }
}

async function configureDarkJKCoach() {
  console.log('🎯 Configuring Dark JK Business Coach...');
  
  try {
    // Load configuration and system prompt
    const config = await loadConfig('config/agents/darkjk-config.json');
    const systemPrompt = await loadPrompt('config/prompts/darkjk-system.md');
    
    // Replace environment variable in vector store ID
    const vectorStoreId = process.env.DARKJK_VECTOR_STORE_ID || 'vs_67df294659c48191bffbe978d27fc6f7';
    if (config.tool_resources?.file_search?.vector_store_ids) {
      config.tool_resources.file_search.vector_store_ids = [vectorStoreId];
    }
    
    // Create agent configuration
    const darkJKAgent = {
      ...config,
      instructions: systemPrompt,
      provider: 'openai',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Upsert agent (update if exists, create if not)
    const result = await Agent.findOneAndUpdate(
      { name: darkJKAgent.name },
      darkJKAgent,
      { upsert: true, new: true, runValidators: true }
    );
    
    console.log('✅ Dark JK Business Coach configured successfully');
    console.log(`   ID: ${result._id}`);
    console.log(`   Vector Store: ${vectorStoreId}`);
    
    return result;
  } catch (error) {
    console.error('❌ Failed to configure Dark JK Coach:', error);
    throw error;
  }
}

async function configureHybridOfferCreator() {
  console.log('📝 Configuring Hybrid Offer Creator...');
  
  try {
    // Load configuration and prompts
    const config = await loadConfig('config/agents/hybrid-offer-config.json');
    const conversationPrompt = await loadPrompt('config/prompts/hybrid-conversation.md');
    const generationPrompt = await loadPrompt('config/prompts/hybrid-generation.md');
    
    // Create agent configuration
    const hybridOfferAgent = {
      ...config,
      instructions: conversationPrompt,
      provider: 'anthropic',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Store generation prompt in metadata for document generation phase
      metadata: {
        ...config.metadata,
        generationPrompt: generationPrompt
      }
    };
    
    // Upsert agent
    const result = await Agent.findOneAndUpdate(
      { name: hybridOfferAgent.name },
      hybridOfferAgent,
      { upsert: true, new: true, runValidators: true }
    );
    
    console.log('✅ Hybrid Offer Creator configured successfully');
    console.log(`   ID: ${result._id}`);
    console.log(`   Models: Conversation (${config.model}), Generation (${config.metadata.documentGenerationModel})`);
    
    return result;
  } catch (error) {
    console.error('❌ Failed to configure Hybrid Offer Creator:', error);
    throw error;
  }
}

async function verifyConfiguration() {
  console.log('\n🔍 Verifying agent configuration...');
  
  try {
    const agents = await Agent.find({ isActive: true }).select('name model provider metadata.requiredTier');
    
    console.log(`\n📊 Active Business Tools: ${agents.length}`);
    agents.forEach(agent => {
      console.log(`   - ${agent.name}`);
      console.log(`     Model: ${agent.model} (${agent.provider})`);
      console.log(`     Required Tier: ${agent.metadata?.requiredTier || 'free'}`);
    });
    
    return agents;
  } catch (error) {
    console.error('❌ Failed to verify configuration:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 AI Business Tools Platform - Agent Configuration');
  console.log('==================================================\n');
  
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB Atlas\n');
    
    // Configure agents
    const darkJK = await configureDarkJKCoach();
    const hybridOffer = await configureHybridOfferCreator();
    
    // Verify configuration
    await verifyConfiguration();
    
    // Summary
    console.log('\n✨ Agent configuration complete!');
    console.log('\nNext steps:');
    console.log('1. Ensure LibreChat is running');
    console.log('2. Create admin user if not exists');
    console.log('3. Test agents with premium user account');
    console.log('4. Monitor agent usage in admin panel');
    
  } catch (error) {
    console.error('\n❌ Configuration failed:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

// Export functions for testing
module.exports = {
  configureDarkJKCoach,
  configureHybridOfferCreator,
  verifyConfiguration
};