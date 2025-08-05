const { MongoClient } = require('mongodb');

// MongoDB connection URI from your .env
const MONGO_URI = 'mongodb+srv://dschwartz06:6ZMOgKoMsuYVq8Ub@sovereignai.fgbvfyn.mongodb.net/?retryWrites=true&appName=SovereignAI';

async function checkAdminAgents() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas\n');
    
    const db = client.db('LibreChat');
    const agents = db.collection('agents');
    const users = db.collection('users');
    
    // Find the admin user
    const adminUser = await users.findOne({ 
      email: 'dschwartz06@gmail.com'
    });
    
    if (!adminUser) {
      console.log('Admin user dschwartz06@gmail.com not found in database.');
      console.log('\nAll users in database:');
      const allUsers = await users.find({}).toArray();
      allUsers.forEach(user => {
        console.log(`- ${user.email} (${user.name || 'no name'}) - ID: ${user._id}`);
      });
      return;
    }
    
    console.log('Found admin user:');
    console.log(`- ${adminUser.name} (${adminUser.email}) - ID: ${adminUser._id}\n`);
    
    // Check agents collection
    const totalAgents = await agents.countDocuments();
    console.log(`Total agents in collection: ${totalAgents}\n`);
    
    if (totalAgents > 0) {
      // Get all agents
      const allAgents = await agents.find({}).toArray();
      
      console.log('All agents in database:');
      console.log('======================\n');
      
      allAgents.forEach((agent, index) => {
        console.log(`Agent #${index + 1}:`);
        console.log(`- Name: ${agent.name}`);
        console.log(`- ID: ${agent._id || agent.agent_id}`);
        console.log(`- Author/User: ${agent.author || agent.user}`);
        console.log(`- Created: ${agent.createdAt}`);
        
        if (agent.avatar) {
          console.log(`- Avatar: ${agent.avatar}`);
        }
        
        if (agent.metadata?.avatar) {
          console.log(`- Metadata Avatar: ${agent.metadata.avatar}`);
        }
        
        if (agent.isPublic !== undefined || agent.is_public !== undefined) {
          console.log(`- Is Public: ${agent.isPublic || agent.is_public}`);
        }
        
        if (agent.shareCode || agent.share_code) {
          console.log(`- Share Code: ${agent.shareCode || agent.share_code}`);
        }
        
        // Show more fields to understand structure
        const otherFields = Object.keys(agent).filter(key => 
          !['_id', 'name', 'author', 'user', 'createdAt', 'avatar', 'metadata', 'isPublic', 'is_public', 'shareCode', 'share_code'].includes(key)
        );
        
        if (otherFields.length > 0) {
          console.log(`- Other fields: ${otherFields.join(', ')}`);
        }
        
        console.log('---\n');
      });
      
      // Look specifically for our target agents
      const targetAgentIds = [
        'agent_KVXW88WVte1tcyABlAowy', // DarkJK
        'agent_jkxFi4j4VZLDT8voWoXxm', // Hybrid Offer
        'agent_cCc7tBkYYjE3j4NS0QjST', // Daily Client
        'agent_DQbu_zXcPMFZCDqq-j3dX', // Ideal Client
        'agent_odD3oMA9NgaPXQEcf0Pnq', // SovereignJK
        'agent_QCDKPRFv8sY6LC_IWuqrh'  // Workshop
      ];
      
      const foundTargets = allAgents.filter(agent => 
        targetAgentIds.includes(agent._id) || 
        targetAgentIds.includes(agent.agent_id) ||
        targetAgentIds.includes(agent.id)
      );
      
      if (foundTargets.length > 0) {
        console.log('\n🎯 FOUND TARGET AGENTS:');
        console.log('======================\n');
        
        foundTargets.forEach(agent => {
          console.log(`${agent.name} (${agent._id || agent.agent_id})`);
          console.log(`Avatar: ${agent.avatar || 'null/undefined'}`);
          
          // Check if this is DarkJK
          if ((agent._id || agent.agent_id) === 'agent_KVXW88WVte1tcyABlAowy') {
            console.log('⚠️  This is DarkJK - the one with icon issues!');
          }
          
          console.log('');
        });
      } else {
        console.log('\n❌ None of our target agents found in the database!');
        console.log('This suggests agents might be stored differently or in a different database.');
      }
    } else {
      console.log('No agents found in the agents collection.');
      console.log('\nThis could mean:');
      console.log('1. Agents are managed through OpenAI API + librechat.yaml only');
      console.log('2. This database might be for development/testing only');
      console.log('3. Production uses a different MongoDB instance');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Run the script
checkAdminAgents();