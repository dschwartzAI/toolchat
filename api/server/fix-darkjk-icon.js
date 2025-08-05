const { MongoClient } = require('mongodb');

// MongoDB connection URI from your .env
const MONGO_URI = 'mongodb+srv://dschwartz06:6ZMOgKoMsuYVq8Ub@sovereignai.fgbvfyn.mongodb.net/?retryWrites=true&appName=SovereignAI';

async function fixDarkJKIcon() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas\n');
    
    const db = client.db('LibreChat');
    const agents = db.collection('agents');
    
    // First, compare DarkJK with a working agent
    console.log('Comparing DarkJK with Hybrid Offer Printer:\n');
    
    const comparison = await agents.find(
      { 
        _id: { 
          $in: [
            'agent_KVXW88WVte1tcyABlAowy', // DarkJK (broken)
            'agent_jkxFi4j4VZLDT8voWoXxm', // Hybrid Offer (working)
          ]
        }
      },
      { 
        projection: { _id: 1, name: 1, avatar: 1 } 
      }
    ).toArray();
    
    comparison.forEach(agent => {
      console.log(`Agent: ${agent.name || agent._id}`);
      console.log(`ID: ${agent._id}`);
      if (agent.avatar) {
        console.log(`Avatar: ${JSON.stringify(agent.avatar, null, 2)}`);
      } else {
        console.log('Avatar: null/undefined (uses librechat.yaml iconURL) ✓');
      }
      console.log('---\n');
    });
    
    // Check if DarkJK has an avatar field
    const darkJK = comparison.find(a => a._id === 'agent_KVXW88WVte1tcyABlAowy');
    
    if (darkJK && darkJK.avatar) {
      console.log('DarkJK has an avatar field that needs to be cleared.\n');
      
      // Clear DarkJK's broken avatar reference
      console.log('Clearing DarkJK avatar field...');
      
      const result = await agents.updateOne(
        { _id: 'agent_KVXW88WVte1tcyABlAowy' },
        { $unset: { avatar: '' } }
      );
      
      if (result.modifiedCount > 0) {
        console.log('✅ Successfully cleared DarkJK avatar!');
        console.log('DarkJK will now use /images/darkjk.jpg from librechat.yaml');
      } else {
        console.log('⚠️  No changes made - avatar might already be cleared');
      }
    } else if (darkJK && !darkJK.avatar) {
      console.log('✅ DarkJK already has no avatar field - should be using librechat.yaml icon');
      console.log('If icon still not showing, the issue might be elsewhere');
    } else {
      console.log('❌ DarkJK agent not found in database!');
      console.log('This might mean agents are stored differently or in another database');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Run the script
fixDarkJKIcon();