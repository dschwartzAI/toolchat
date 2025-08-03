// Script to remove conversation starters from specific agents
// Uses LibreChat's existing database connection

const connectDb = require('~/config/db/connectDb');
const Agent = require('~/models/Agent');

// Agent IDs to update
const AGENT_IDS = [
  'agent_KVXW88WVte1tcyABlAowy', // DarkJK
  'agent_odD3oMA9NgaPXQEcf0Pnq'  // SovereignJK
];

async function removeConversationStarters() {
  try {
    // Connect to database using LibreChat's connection
    await connectDb();
    console.log('Connected to database');

    // Check current state
    console.log('\nChecking agents:');
    for (const agentId of AGENT_IDS) {
      const agent = await Agent.findOne({ id: agentId });
      if (agent) {
        console.log(`\nAgent: ${agent.name} (${agentId})`);
        console.log(`Current starters: ${JSON.stringify(agent.conversation_starters || [])}`);
        
        // Remove conversation starters
        agent.conversation_starters = [];
        await agent.save();
        console.log('✓ Removed conversation starters');
      } else {
        console.log(`\nAgent ${agentId} not found`);
      }
    }

    console.log('\n✅ Script completed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

removeConversationStarters();