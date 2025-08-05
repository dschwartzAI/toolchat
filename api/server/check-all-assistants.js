const { MongoClient } = require('mongodb');

// MongoDB connection URI from your .env
const MONGO_URI = 'mongodb+srv://dschwartz06:6ZMOgKoMsuYVq8Ub@sovereignai.fgbvfyn.mongodb.net/?retryWrites=true&appName=SovereignAI';

async function checkAllAssistants() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas\n');
    
    const db = client.db('LibreChat');
    const assistants = db.collection('assistants');
    
    // Get total count
    const totalCount = await assistants.countDocuments();
    console.log(`Total assistants in collection: ${totalCount}\n`);
    
    if (totalCount === 0) {
      console.log('No assistants found in the database.\n');
      console.log('This suggests one of the following:');
      console.log('1. Agents are managed entirely through librechat.yaml + OpenAI API');
      console.log('2. You might be connected to a different database than production');
      console.log('3. The agents might be stored in a different way\n');
      
      // Check if there's any data at all in the database
      const collections = await db.listCollections().toArray();
      let hasData = false;
      
      console.log('Checking if database has any data:');
      for (const coll of collections) {
        const count = await db.collection(coll.name).countDocuments();
        if (count > 0) {
          console.log(`✓ ${coll.name}: ${count} documents`);
          hasData = true;
        }
      }
      
      if (!hasData) {
        console.log('\n⚠️  Database appears to be empty or this is the wrong database!');
      }
      
      return;
    }
    
    // If we have assistants, show them all
    const allAssistants = await assistants.find({}).toArray();
    
    console.log('All assistants in database:');
    console.log('==========================\n');
    
    allAssistants.forEach((asst, index) => {
      console.log(`Assistant #${index + 1}:`);
      console.log(`- Name: ${asst.name}`);
      console.log(`- ID: ${asst.assistant_id}`);
      console.log(`- User: ${asst.user}`);
      console.log(`- Created: ${asst.createdAt}`);
      
      if (asst.avatar) {
        console.log(`- Avatar: ${asst.avatar}`);
      }
      
      if (asst.metadata?.avatar) {
        console.log(`- Metadata Avatar: ${asst.metadata.avatar}`);
      }
      
      if (asst.is_public !== undefined) {
        console.log(`- Is Public: ${asst.is_public}`);
      }
      
      if (asst.share_code) {
        console.log(`- Share Code: ${asst.share_code}`);
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
    
    const foundTargets = allAssistants.filter(asst => 
      targetAgentIds.includes(asst.assistant_id)
    );
    
    if (foundTargets.length > 0) {
      console.log('\n🎯 FOUND TARGET AGENTS:');
      console.log('======================\n');
      
      foundTargets.forEach(asst => {
        console.log(`${asst.name} (${asst.assistant_id})`);
        console.log(`Avatar: ${asst.avatar || 'null/undefined'}`);
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
checkAllAssistants();