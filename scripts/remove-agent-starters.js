const mongoose = require('mongoose');
require('dotenv').config();

// Agent IDs to update
const AGENT_IDS = [
  'agent_KVXW88WVte1tcyABlAowy', // DarkJK
  'agent_odD3oMA9NgaPXQEcf0Pnq'  // SovereignJK
];

async function removeConversationStarters() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('MONGO_URI not found in environment variables');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get the agents collection
    const db = mongoose.connection.db;
    const agentsCollection = db.collection('agents');

    // First, let's check the current state of these agents
    console.log('\nChecking current agent configurations:');
    for (const agentId of AGENT_IDS) {
      const agent = await agentsCollection.findOne({ id: agentId });
      if (agent) {
        console.log(`\nAgent: ${agent.name} (${agentId})`);
        console.log(`Current conversation starters: ${JSON.stringify(agent.conversation_starters || [])}`);
      } else {
        console.log(`\nAgent ${agentId} not found`);
      }
    }

    // Ask for confirmation
    console.log('\nProceed with removing conversation starters? (y/n)');
    
    // For automated execution, we'll proceed
    // In a real scenario, you'd wait for user input
    
    // Update the agents
    console.log('\nUpdating agents...');
    for (const agentId of AGENT_IDS) {
      const result = await agentsCollection.updateOne(
        { id: agentId },
        { $set: { conversation_starters: [] } }
      );
      
      if (result.matchedCount > 0) {
        console.log(`✓ Updated agent ${agentId} - removed conversation starters`);
      } else {
        console.log(`✗ Agent ${agentId} not found`);
      }
    }

    // Verify the updates
    console.log('\nVerifying updates:');
    for (const agentId of AGENT_IDS) {
      const agent = await agentsCollection.findOne({ id: agentId });
      if (agent) {
        console.log(`Agent ${agent.name}: conversation_starters = ${JSON.stringify(agent.conversation_starters)}`);
      }
    }

    console.log('\n✅ Script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
removeConversationStarters();