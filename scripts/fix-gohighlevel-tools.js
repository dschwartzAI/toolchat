#!/usr/bin/env node

/**
 * Script to ensure GoHighLevel tools are properly configured
 * This adds the MCP tool configuration to the agent
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const AGENT_ID = 'agent_iQEgiUTn0qgQ9s5c0NWvs';

async function fixGoHighLevelTools() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const agentsCollection = db.collection('agents');
    
    // Update the agent to include GoHighLevel MCP tools
    const updateResult = await agentsCollection.updateOne(
      { id: AGENT_ID },
      {
        $set: {
          tools: ['mcp:gohighlevel'],
          capabilities: {
            file_search: false,
            artifacts: true,
            tools: true,
            actions: false,
            web_search: false
          },
          updatedAt: new Date()
        }
      }
    );
    
    if (updateResult.modifiedCount > 0) {
      console.log('✅ Fixed GoHighLevel agent tools configuration');
    } else {
      console.log('ℹ️  Agent tools were already configured');
    }
    
    // Verify the configuration
    const agent = await agentsCollection.findOne({ id: AGENT_ID });
    console.log('\n📋 Agent tools configuration:');
    console.log('- Tools:', JSON.stringify(agent.tools, null, 2));
    
  } catch (error) {
    console.error('❌ Error fixing agent tools:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Done! The agent should now have access to GoHighLevel tools.');
  }
}

// Run the fix
fixGoHighLevelTools();