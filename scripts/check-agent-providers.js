#!/usr/bin/env node

/**
 * Script to check and optionally fix agent provider mismatches
 * Useful for finding agents with incorrect provider settings
 */

const path = require('path');
const mongoose = require(path.join(__dirname, '../api/node_modules/mongoose'));
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// MongoDB connection string from .env
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error('Error: MONGO_URI not found in environment variables');
  process.exit(1);
}

// Agent schema definition
const agentSchema = new mongoose.Schema({
  user: { type: String, required: true },
  agent_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  provider: { type: String, required: true },
  model: { type: String, required: true },
  model_parameters: Object,
  tools: [{ type: String }],
  file_ids: [{ type: String }],
  updatedAt: Date,
  createdAt: Date,
});

const Agent = mongoose.model('Agent', agentSchema);

// Known model to provider mappings
const modelProviderMap = {
  // XAI/Grok models
  'grok-beta': 'xai',
  'grok-2': 'xai',
  'grok-4': 'xai',
  'grok-4-0709': 'xai',
  'grok-2-1212': 'xai',
  'grok-2-vision-1212': 'xai',
  
  // Anthropic models
  'claude-3-5-sonnet-20241022': 'anthropic',
  'claude-3-5-haiku-20241022': 'anthropic',
  'claude-3-opus-20240229': 'anthropic',
  'claude-3-haiku-20240307': 'anthropic',
  'claude-3-sonnet-20240229': 'anthropic',
  'claude-sonnet-4-20250514': 'anthropic',
  'claude-opus-4-20250514': 'anthropic',
  
  // OpenAI models
  'gpt-4o': 'openAI',
  'gpt-4o-mini': 'openAI',
  'gpt-4-turbo': 'openAI',
  'gpt-4': 'openAI',
  'gpt-3.5-turbo': 'openAI',
};

async function checkAgentProviders() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected successfully\n');

    // Get all agents
    const agents = await Agent.find({});
    console.log(`Found ${agents.length} agents\n`);

    const issues = [];

    // Check each agent
    for (const agent of agents) {
      const expectedProvider = modelProviderMap[agent.model];
      
      if (expectedProvider && agent.provider !== expectedProvider) {
        issues.push({
          agent_id: agent.agent_id,
          name: agent.name,
          model: agent.model,
          currentProvider: agent.provider,
          expectedProvider: expectedProvider
        });
      }
    }

    // Report findings
    if (issues.length === 0) {
      console.log('✅ All agents have correct provider settings!');
    } else {
      console.log(`⚠️  Found ${issues.length} agent(s) with provider mismatches:\n`);
      
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.name} (${issue.agent_id})`);
        console.log(`   Model: ${issue.model}`);
        console.log(`   Current Provider: ${issue.currentProvider}`);
        console.log(`   Expected Provider: ${issue.expectedProvider}`);
        console.log('');
      });

      // Ask if user wants to fix
      if (process.argv.includes('--fix')) {
        console.log('Fixing provider mismatches...\n');
        
        for (const issue of issues) {
          const agent = await Agent.findOne({ agent_id: issue.agent_id });
          agent.provider = issue.expectedProvider;
          agent.updatedAt = new Date();
          await agent.save();
          
          console.log(`✅ Fixed ${issue.name}: ${issue.currentProvider} → ${issue.expectedProvider}`);
        }
        
        console.log('\nAll issues fixed!');
      } else {
        console.log('To fix these issues, run: npm run check-agents -- --fix');
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the check
checkAgentProviders();