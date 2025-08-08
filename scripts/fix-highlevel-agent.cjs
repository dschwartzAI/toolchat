#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { MongoClient } = require('mongodb');

const AGENT_ID = 'agent_iQEgiUTn0qgQ9s5c0NWvs';
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI not found in environment variables');
  process.exit(1);
}

async function fixHighLevelAgent() {
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
        user: '000000000000000000000000',
        name: 'HighLevel CRM',
        description: 'AI assistant with full GoHighLevel CRM access - manage contacts, pipelines, appointments, and campaigns',
        instructions: `You are a GoHighLevel CRM assistant with direct access to MCP tools for managing CRM data.

You have access to the following GoHighLevel tools through MCP:
- Calendar management (events, appointments)
- Contact management (create, update, search, add/remove tags)
- Conversation management (search, send messages)
- Pipeline/opportunity management
- Payment and transaction tracking
- Location and custom field management

When users ask about CRM data or tasks, actively use these tools to help them. Don't just describe what you could do - actually use the tools to fetch real data and perform actions.

Examples of what you can do:
- "Show me my contacts" - use contacts_get-contacts tool
- "What's on my calendar?" - use calendars_get-calendar-events tool
- "Add a tag to contact X" - use contacts_add-tags tool
- "Show me my pipeline" - use opportunities_get-pipelines tool

Always be proactive in using the available tools to provide real, actionable information from the CRM.`,
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
      console.log('Created new HighLevel agent with enhanced instructions');
    } else {
      console.log('Current agent configuration:');
      console.log('Name:', agent.name);
      console.log('Tools:', JSON.stringify(agent.tools));
      console.log('Current Instructions:', agent.instructions?.substring(0, 200) + '...');
      
      // Update the agent with enhanced instructions and correct configuration
      const updateResult = await agentsCollection.updateOne(
        { id: AGENT_ID },
        {
          $set: {
            name: 'HighLevel CRM',
            tools: ['mcp:gohighlevel'],
            capabilities: {
              file_search: false,
              artifacts: true,
              tools: true,
              actions: false,
              web_search: false
            },
            instructions: `You are a GoHighLevel CRM assistant with direct access to MCP tools for managing CRM data.

You have access to the following GoHighLevel tools through MCP:
- Calendar management (events, appointments)
- Contact management (create, update, search, add/remove tags)
- Conversation management (search, send messages)
- Pipeline/opportunity management
- Payment and transaction tracking
- Location and custom field management

When users ask about CRM data or tasks, actively use these tools to help them. Don't just describe what you could do - actually use the tools to fetch real data and perform actions.

Examples of what you can do:
- "Show me my contacts" - use contacts_get-contacts tool
- "What's on my calendar?" - use calendars_get-calendar-events tool
- "Add a tag to contact X" - use contacts_add-tags tool
- "Show me my pipeline" - use opportunities_get-pipelines tool

Always be proactive in using the available tools to provide real, actionable information from the CRM.`,
            updated_at: new Date()
          }
        }
      );
      
      console.log('Update result:', updateResult.modifiedCount, 'document(s) modified');
      
      // Verify the update
      const updatedAgent = await agentsCollection.findOne({ id: AGENT_ID });
      console.log('\nUpdated configuration:');
      console.log('Name:', updatedAgent.name);
      console.log('Tools:', JSON.stringify(updatedAgent.tools));
      console.log('New Instructions:', updatedAgent.instructions?.substring(0, 200) + '...');
    }
    
    console.log('\n✅ HighLevel agent configuration enhanced with detailed instructions');
    console.log('The agent now has explicit instructions to use MCP tools proactively.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('Connection closed');
  }
}

fixHighLevelAgent();