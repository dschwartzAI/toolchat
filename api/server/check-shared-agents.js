const { MongoClient } = require('mongodb');

// MongoDB connection URI from your .env
const MONGO_URI = 'mongodb+srv://dschwartz06:6ZMOgKoMsuYVq8Ub@sovereignai.fgbvfyn.mongodb.net/?retryWrites=true&appName=SovereignAI';

async function checkSharedAgents() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas\n');
    
    const db = client.db('LibreChat');
    const assistants = db.collection('assistants');
    const users = db.collection('users');
    
    // Find admin user(s)
    const adminUsers = await users.find({ 
      $or: [
        { role: 'ADMIN' },
        { email: 'admin@yourdomain.com' },
        { email: 'jk@jameskemp.co' } // The user we found
      ]
    }).toArray();
    
    console.log('Found admin users:');
    adminUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - ID: ${user._id}`);
    });
    console.log('\n');
    
    // Check assistants for each admin user
    for (const user of adminUsers) {
      console.log(`\nChecking assistants for ${user.name}:`);
      console.log('================================\n');
      
      // Find assistants owned by this user
      const userAssistants = await assistants.find({ 
        user: user._id.toString() 
      }).toArray();
      
      console.log(`Found ${userAssistants.length} assistants\n`);
      
      // Focus on our specific agents
      const targetAgentIds = [
        'agent_KVXW88WVte1tcyABlAowy', // DarkJK
        'agent_jkxFi4j4VZLDT8voWoXxm', // Hybrid Offer
        'agent_cCc7tBkYYjE3j4NS0QjST', // Daily Client
        'agent_DQbu_zXcPMFZCDqq-j3dX', // Ideal Client
        'agent_odD3oMA9NgaPXQEcf0Pnq', // SovereignJK
        'agent_QCDKPRFv8sY6LC_IWuqrh'  // Workshop
      ];
      
      // Check each assistant
      userAssistants.forEach(asst => {
        if (targetAgentIds.includes(asst.assistant_id)) {
          console.log(`🎯 TARGET AGENT FOUND: ${asst.name}`);
          console.log(`   ID: ${asst.assistant_id}`);
          console.log(`   Avatar: ${asst.avatar || 'null/undefined (will use modelSpec)'}`);
          console.log(`   Metadata Avatar: ${asst.metadata?.avatar || 'null/undefined'}`);
          
          // Check if shared
          if (asst.share_code) {
            console.log(`   Share Code: ${asst.share_code}`);
          }
          if (asst.is_public) {
            console.log(`   Is Public: ${asst.is_public}`);
          }
          
          console.log('---\n');
        }
      });
      
      // Show all assistants if we didn't find our targets
      if (userAssistants.length > 0 && userAssistants.length <= 10) {
        console.log('All assistants for this user:');
        userAssistants.forEach(asst => {
          console.log(`- ${asst.name} (${asst.assistant_id})`);
          if (asst.avatar) {
            console.log(`  Avatar: ${asst.avatar}`);
          }
        });
      }
    }
    
    // Also check for shared agents collection or sharing mechanism
    console.log('\n\nChecking sharing mechanism:');
    console.log('==========================\n');
    
    // Look for any public/shared assistants
    const sharedAssistants = await assistants.find({
      $or: [
        { is_public: true },
        { share_code: { $exists: true, $ne: null } }
      ]
    }).toArray();
    
    console.log(`Found ${sharedAssistants.length} shared/public assistants\n`);
    
    if (sharedAssistants.length > 0) {
      sharedAssistants.forEach(asst => {
        console.log(`- ${asst.name} (${asst.assistant_id})`);
        console.log(`  Owner: ${asst.user}`);
        console.log(`  Public: ${asst.is_public || false}`);
        console.log(`  Share Code: ${asst.share_code || 'none'}`);
        if (asst.avatar) {
          console.log(`  Avatar: ${asst.avatar}`);
        }
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Run the script
checkSharedAgents();