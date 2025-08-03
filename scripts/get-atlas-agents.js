const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://dschwartz06:6ZMOgKoMsuYVq8Ub@sovereignai.fgbvfyn.mongodb.net/?retryWrites=true&appName=SovereignAI';

async function getAgents() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    
    const db = client.db('SovereignAI');
    const agents = await db.collection('agents').find({}).toArray();
    
    console.log(`\nFound ${agents.length} agents:\n`);
    
    agents.forEach(agent => {
      console.log(`Name: ${agent.name}`);
      console.log(`ID: ${agent._id}`);
      console.log(`Model: ${agent.model || 'N/A'}`);
      console.log(`Provider: ${agent.provider || 'N/A'}`);
      console.log(`Description: ${agent.description || 'No description'}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

getAgents();