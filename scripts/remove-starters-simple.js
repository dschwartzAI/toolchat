const { MongoClient } = require('mongodb');

// Agent IDs to update
const AGENT_IDS = [
  'agent_KVXW88WVte1tcyABlAowy', // DarkJK
  'agent_odD3oMA9NgaPXQEcf0Pnq'  // SovereignJK
];

async function removeConversationStarters() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI not found');
    process.exit(1);
  }

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const agentsCollection = db.collection('agents');

    // Check current state
    console.log('\nCurrent agent configurations:');
    for (const agentId of AGENT_IDS) {
      const agent = await agentsCollection.findOne({ id: agentId });
      if (agent) {
        console.log(`\nAgent: ${agent.name} (${agentId})`);
        console.log(`Conversation starters: ${JSON.stringify(agent.conversation_starters || [])}`);
      }
    }

    // Update agents
    console.log('\nRemoving conversation starters...');
    for (const agentId of AGENT_IDS) {
      const result = await agentsCollection.updateOne(
        { id: agentId },
        { $set: { conversation_starters: [] } }
      );
      console.log(`Updated ${agentId}: ${result.modifiedCount} document(s)`);
    }

    console.log('\n✅ Done');
  } finally {
    await client.close();
  }
}

removeConversationStarters().catch(console.error);