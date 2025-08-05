const { MongoClient } = require('mongodb');

// MongoDB connection URI from your .env
const MONGO_URI = 'mongodb+srv://dschwartz06:6ZMOgKoMsuYVq8Ub@sovereignai.fgbvfyn.mongodb.net/?retryWrites=true&appName=SovereignAI';

async function checkDatabaseStructure() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas\n');
    
    const db = client.db('LibreChat');
    
    // Check various collections
    const collections = [
      'agents',
      'assistants', 
      'users',
      'conversations',
      'messages',
      'files'
    ];
    
    for (const collName of collections) {
      const coll = db.collection(collName);
      const count = await coll.countDocuments();
      console.log(`${collName}: ${count} documents`);
      
      if (count > 0 && count < 10) {
        // Show all documents if there are few
        const docs = await coll.find({}).toArray();
        console.log(`Sample documents:`);
        docs.forEach(doc => {
          console.log(JSON.stringify(doc, null, 2).substring(0, 500) + '...\n');
        });
      } else if (count >= 10) {
        // Show first 2 documents if there are many
        const docs = await coll.find({}).limit(2).toArray();
        console.log(`First 2 documents:`);
        docs.forEach(doc => {
          console.log(JSON.stringify(doc, null, 2).substring(0, 500) + '...\n');
        });
      }
      console.log('---\n');
    }
    
    // Look for any collection with "agent" in the name
    const allCollections = await db.listCollections().toArray();
    const agentRelated = allCollections.filter(c => 
      c.name.toLowerCase().includes('agent') || 
      c.name.toLowerCase().includes('assistant')
    );
    
    console.log('Collections with "agent" or "assistant" in name:', 
      agentRelated.map(c => c.name).join(', '));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Run the script
checkDatabaseStructure();