#!/usr/bin/env node
const { MongoClient } = require('mongodb');

async function listAgents() {
  const client = new MongoClient('mongodb://localhost:27017/LibreChat');
  
  try {
    await client.connect();
    const db = client.db('LibreChat');
    const agents = await db.collection('agents').find({}).toArray();
    
    console.log('Found agents:');
    agents.forEach(agent => {
      console.log(`- Name: ${agent.name}`);
      console.log(`  ID: ${agent._id}`);
      console.log(`  Description: ${agent.description || 'No description'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

listAgents().catch(console.error);