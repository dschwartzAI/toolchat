#!/usr/bin/env node
/**
 * Backup all agents from MongoDB
 * Saves to agents-backup-[timestamp].json
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/LibreChat';

async function backupAgents() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('LibreChat');
    const agents = await db.collection('agents').find({}).toArray();
    
    console.log(`Found ${agents.length} agents`);
    
    // Create backup with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const backupPath = path.join(__dirname, '..', `agents-backup-${timestamp}.json`);
    
    // Format agents for readability
    const backup = {
      timestamp: new Date().toISOString(),
      count: agents.length,
      agents: agents.map(agent => ({
        id: agent._id,
        name: agent.name,
        description: agent.description,
        model: agent.model,
        provider: agent.provider,
        instructions: agent.instructions,
        tools: agent.tools,
        tool_resources: agent.tool_resources,
        actions: agent.actions,
        capabilities: agent.capabilities,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt
      }))
    };
    
    // Write backup file
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    console.log(`Backup saved to: ${backupPath}`);
    
    // Also create a summary for quick reference
    const summary = agents.map(agent => ({
      id: agent._id,
      name: agent.name,
      description: agent.description,
      model: agent.model
    }));
    
    console.log('\nAgent Summary:');
    console.log(JSON.stringify(summary, null, 2));
    
  } catch (error) {
    console.error('Error backing up agents:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run backup
backupAgents().catch(console.error);