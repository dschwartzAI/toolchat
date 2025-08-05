const { MongoClient } = require('mongodb');

// MongoDB connection URI from your .env
const MONGO_URI = 'mongodb+srv://dschwartz06:6ZMOgKoMsuYVq8Ub@sovereignai.fgbvfyn.mongodb.net/?retryWrites=true&appName=SovereignAI';

async function clearAgentAvatars() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    
    const db = client.db('LibreChat');
    const agents = db.collection('agents');
    
    // Agent IDs from librechat.yaml
    const agentIds = [
      'agent_KVXW88WVte1tcyABlAowy', // DarkJK
      'agent_jkxFi4j4VZLDT8voWoXxm', // Hybrid Offer Printer
      'agent_cCc7tBkYYjE3j4NS0QjST', // Daily Client Machine
      'agent_DQbu_zXcPMFZCDqq-j3dX', // Ideal Client Extractor
      'agent_odD3oMA9NgaPXQEcf0Pnq', // SovereignJK
      'agent_QCDKPRFv8sY6LC_IWuqrh'  // Workshop Copy-Paster
    ];
    
    // Clear avatar field for all business tool agents
    const result = await agents.updateMany(
      { _id: { $in: agentIds } },
      { $unset: { avatar: '' } }
    );
    
    console.log(`Updated ${result.modifiedCount} agents`);
    console.log('Avatar fields cleared successfully!');
    console.log('\nAgents will now use static icons from librechat.yaml on all instances.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Run the script
clearAgentAvatars();