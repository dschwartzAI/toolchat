const { MongoClient } = require('mongodb');

// MongoDB connection URI from your .env
const MONGO_URI = 'mongodb+srv://dschwartz06:6ZMOgKoMsuYVq8Ub@sovereignai.fgbvfyn.mongodb.net/?retryWrites=true&appName=SovereignAI';

async function checkAgentAvatars() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas\n');
    
    // List all databases
    const dbList = await client.db().admin().listDatabases();
    console.log('Available databases:');
    dbList.databases.forEach(db => {
      console.log(`- ${db.name} (size: ${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    console.log('\n');
    
    // Use the correct database
    const dbName = 'LibreChat';
    const db = client.db(dbName);
    const agents = db.collection('agents');
    const assistants = db.collection('assistants');
    
    // Check specific agents
    const agentIds = [
      'agent_KVXW88WVte1tcyABlAowy', // DarkJK (not working)
      'agent_jkxFi4j4VZLDT8voWoXxm', // Hybrid Offer (working)
      'agent_cCc7tBkYYjE3j4NS0QjST', // Daily Client (working)
      'agent_DQbu_zXcPMFZCDqq-j3dX', // Ideal Client Extractor
      'agent_odD3oMA9NgaPXQEcf0Pnq', // SovereignJK
      'agent_QCDKPRFv8sY6LC_IWuqrh'  // Workshop Copy-Paster
    ];
    
    // First, let's see what collections exist
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name).join(', '));
    
    // Check if agents exist
    const agentCount = await agents.countDocuments();
    console.log(`\nTotal agents in collection: ${agentCount}`);
    
    // Check assistants collection too
    const assistantCount = await assistants.countDocuments();
    console.log(`Total assistants in collection: ${assistantCount}`);
    
    // Try to find our specific agents in agents collection
    let results = await agents.find(
      { _id: { $in: agentIds } },
      { projection: { _id: 1, name: 1, avatar: 1 } }
    ).toArray();
    
    // If not found in agents, try assistants collection
    if (results.length === 0) {
      console.log('\nChecking assistants collection instead...');
      results = await assistants.find(
        { assistant_id: { $in: agentIds } },
        { projection: { assistant_id: 1, name: 1, avatar: 1, metadata: 1 } }
      ).toArray();
      
      // Map assistant_id to _id for consistency
      results = results.map(r => ({
        _id: r.assistant_id,
        name: r.name,
        avatar: r.avatar || r.metadata?.avatar
      }));
    }
    
    console.log(`Found ${results.length} of our ${agentIds.length} agents\n`);
    
    // If no results, let's see what agents/assistants do exist
    if (results.length === 0) {
      console.log('Sample of existing assistants:');
      const sample = await assistants.find({}).limit(10).toArray();
      sample.forEach(asst => {
        console.log(`- ID: ${asst.assistant_id}, Name: ${asst.name || 'unnamed'}`);
        if (asst.avatar || asst.metadata?.avatar) {
          console.log(`  Avatar: ${asst.avatar || asst.metadata?.avatar}`);
        }
      });
      console.log('\n');
    }
    
    console.log('Agent Avatar Status:');
    console.log('===================\n');
    
    results.forEach(agent => {
      console.log(`Agent: ${agent.name || agent._id}`);
      console.log(`ID: ${agent._id}`);
      
      if (agent.avatar === null) {
        console.log('Avatar: null (will use modelSpec iconURL) ✓');
      } else if (agent.avatar === undefined || !('avatar' in agent)) {
        console.log('Avatar: undefined/missing (will use modelSpec iconURL) ✓');
      } else if (typeof agent.avatar === 'string' && agent.avatar.length > 0) {
        console.log(`Avatar: "${agent.avatar}" ⚠️`);
        console.log('  ^ This file path might not exist on all instances!');
      } else {
        console.log(`Avatar: ${JSON.stringify(agent.avatar)}`);
      }
      
      console.log('---\n');
    });
    
    console.log('\nHypothesis Check:');
    console.log('- If DarkJK has an avatar path and others have null/undefined,');
    console.log('  that explains why only DarkJK has icon issues!');
    console.log('- The system falls back to modelSpec icons when avatar is null/undefined,');
    console.log('  but tries to load broken paths when avatar is set.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Run the script
checkAgentAvatars();