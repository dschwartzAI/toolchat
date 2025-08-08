#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { MongoClient } = require('mongodb');

const AGENT_ID = 'agent_iQEgiUTn0qgQ9s5c0NWvs';
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI not found in environment variables');
  process.exit(1);
}

async function fixGoHighLevelAgent() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('LibreChat');
    const agentsCollection = db.collection('agents');
    
    // First, let's check the current configuration
    const agent = await agentsCollection.findOne({ id: AGENT_ID });
    
    if (!agent) {
      console.error('HighLevel agent not found with ID:', AGENT_ID);
      
      // Create the agent if it doesn't exist
      const newAgent = {
        id: AGENT_ID,
        name: 'HighLevel Agent',
        description: 'AI assistant with full GoHighLevel CRM access',
        instructions: 'You are a GoHighLevel CRM assistant with access to 21+ tools for managing contacts, pipelines, appointments, conversations, and campaigns. Use the available tools to help users with their CRM tasks.',
        provider: 'openai',
        model: 'gpt-4o',
        tools: ['mcp:gohighlevel'],
        capabilities: {
          file_search: false,
          artifacts: true,
          tools: true,
          actions: false,
          web_search: false
        },
        created_at: new Date(),
        updated_at: new Date()
      };
      
      await agentsCollection.insertOne(newAgent);
      console.log('Created new HighLevel agent');
    } else {
      console.log('Current agent configuration:');
      console.log('Name:', agent.name);
      console.log('Tools:', JSON.stringify(agent.tools));
      console.log('Capabilities:', JSON.stringify(agent.capabilities));
      
      // Update the agent to ensure tools are correctly configured
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
            instructions: 'You are a GoHighLevel CRM assistant with access to 21+ tools for managing contacts, pipelines, appointments, conversations, and campaigns. Use the available tools to help users with their CRM tasks.',
            updated_at: new Date()
          }
        }
      );
      
      console.log('Update result:', updateResult.modifiedCount, 'document(s) modified');
      
      // Verify the update
      const updatedAgent = await agentsCollection.findOne({ id: AGENT_ID });
      console.log('\nUpdated configuration:');
      console.log('Tools:', JSON.stringify(updatedAgent.tools));
      console.log('Capabilities:', JSON.stringify(updatedAgent.capabilities));
    }
    
    console.log('\n✅ HighLevel agent configuration fixed successfully');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('Connection closed');
  }
}

fixGoHighLevelAgent();