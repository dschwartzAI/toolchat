#!/usr/bin/env node

/**
 * Script to properly configure the GoHighLevel agent in MongoDB
 * This ensures the agent has the correct tools configuration
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const AGENT_ID = 'agent_iQEgiUTn0qgQ9s5c0NWvs';

async function setupGoHighLevelAgent() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const agentsCollection = db.collection('agents');
    
    // Check if agent exists
    let agent = await agentsCollection.findOne({ id: AGENT_ID });
    
    if (!agent) {
      console.log('Agent not found, creating new GoHighLevel agent...');
      
      // Create the agent
      agent = {
        id: AGENT_ID,
        name: 'HighLevel CRM',
        description: 'AI assistant with full GoHighLevel CRM access - manage contacts, pipelines, appointments, and campaigns',
        instructions: `You are a GoHighLevel CRM assistant with access to MCP tools for managing contacts, pipelines, appointments, conversations, and campaigns.

When users ask about their CRM data, use the available MCP tools to fetch and manage information. The tools available include:
- Calendar and appointment management tools
- Contact management (create, update, search, tag)
- Conversation and messaging tools
- Pipeline and opportunity tracking
- Payment and transaction queries
- Location and custom field management

Always use the actual MCP tools to fetch real data rather than making assumptions.`,
        model: 'gpt-4o',
        tools: [
          {
            type: 'mcp',
            server: 'gohighlevel'
          }
        ],
        capabilities: {
          file_search: false,
          artifacts: true,
          tools: true,
          actions: false,
          web_search: false
        },
        provider: 'openai',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await agentsCollection.insertOne(agent);
      console.log('✅ Created new GoHighLevel agent');
    } else {
      console.log('Agent found, updating configuration...');
      
      // Update the agent to ensure it has MCP tools
      const updateResult = await agentsCollection.updateOne(
        { id: AGENT_ID },
        {
          $set: {
            name: 'HighLevel CRM',
            description: 'AI assistant with full GoHighLevel CRM access - manage contacts, pipelines, appointments, and campaigns',
            instructions: `You are a GoHighLevel CRM assistant with access to MCP tools for managing contacts, pipelines, appointments, conversations, and campaigns.

When users ask about their CRM data, use the available MCP tools to fetch and manage information. The tools available include:
- Calendar and appointment management tools
- Contact management (create, update, search, tag)
- Conversation and messaging tools
- Pipeline and opportunity tracking
- Payment and transaction queries
- Location and custom field management

Always use the actual MCP tools to fetch real data rather than making assumptions.`,
            model: 'gpt-4o',
            tools: [
              {
                type: 'mcp',
                server: 'gohighlevel'
              }
            ],
            capabilities: {
              file_search: false,
              artifacts: true,
              tools: true,
              actions: false,
              web_search: false
            },
            provider: 'openai',
            updatedAt: new Date()
          }
        }
      );
      
      if (updateResult.modifiedCount > 0) {
        console.log('✅ Updated GoHighLevel agent configuration');
      } else {
        console.log('ℹ️  Agent configuration was already up to date');
      }
    }
    
    // Verify the configuration
    const finalAgent = await agentsCollection.findOne({ id: AGENT_ID });
    console.log('\n📋 Final agent configuration:');
    console.log('- Name:', finalAgent.name);
    console.log('- Model:', finalAgent.model);
    console.log('- Tools:', JSON.stringify(finalAgent.tools, null, 2));
    console.log('- Capabilities:', JSON.stringify(finalAgent.capabilities, null, 2));
    
  } catch (error) {
    console.error('❌ Error setting up agent:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Setup complete! Restart the backend server to apply changes.');
  }
}

// Run the setup
setupGoHighLevelAgent();