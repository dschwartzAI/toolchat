const OpenAI = require('openai');

// OpenAI API key from your .env
const openai = new OpenAI({
  apiKey: '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'
});

async function clearOpenAIAvatars() {
  try {
    console.log('Fetching assistants from OpenAI API...\n');
    
    // Target agent IDs from librechat.yaml
    const targetAgentIds = [
      'agent_KVXW88WVte1tcyABlAowy', // DarkJK
      'agent_jkxFi4j4VZLDT8voWoXxm', // Hybrid Offer Printer
      'agent_cCc7tBkYYjE3j4NS0QjST', // Daily Client Machine
      'agent_DQbu_zXcPMFZCDqq-j3dX', // Ideal Client Extractor
      'agent_odD3oMA9NgaPXQEcf0Pnq', // SovereignJK
      'agent_QCDKPRFv8sY6LC_IWuqrh'  // Workshop Copy-Paster
    ];
    
    // Get all assistants
    const assistants = await openai.beta.assistants.list({ limit: 100 });
    
    console.log(`Found ${assistants.data.length} assistants in OpenAI\n`);
    
    // Find our target agents
    const targetAssistants = assistants.data.filter(asst => 
      targetAgentIds.includes(asst.id)
    );
    
    if (targetAssistants.length === 0) {
      console.log('❌ None of our target agents found in OpenAI!');
      console.log('\nAll assistant IDs:');
      assistants.data.forEach(asst => {
        console.log(`- ${asst.id}: ${asst.name}`);
      });
      return;
    }
    
    console.log(`Found ${targetAssistants.length} target agents:\n`);
    
    // Check each target assistant
    for (const assistant of targetAssistants) {
      console.log(`\nAgent: ${assistant.name}`);
      console.log(`ID: ${assistant.id}`);
      
      // Check metadata for avatar
      if (assistant.metadata && assistant.metadata.avatar) {
        console.log(`Current avatar in metadata: ${assistant.metadata.avatar}`);
        console.log('⚠️  This is likely causing the sync issue!');
        
        // Clear the avatar from metadata
        console.log('Clearing avatar from metadata...');
        
        try {
          const updatedMetadata = { ...assistant.metadata };
          delete updatedMetadata.avatar;
          
          await openai.beta.assistants.update(assistant.id, {
            metadata: updatedMetadata
          });
          
          console.log('✅ Avatar cleared successfully!');
        } catch (error) {
          console.error(`❌ Error clearing avatar: ${error.message}`);
        }
      } else {
        console.log('✅ No avatar in metadata (good!)');
      }
      
      // Special check for DarkJK
      if (assistant.id === 'agent_KVXW88WVte1tcyABlAowy') {
        console.log('\n🎯 This is DarkJK - the agent with icon issues');
        console.log('After clearing avatar, it should use iconURL from librechat.yaml');
      }
    }
    
    console.log('\n\nSummary:');
    console.log('=========');
    console.log('Avatar fields have been cleared from OpenAI assistant metadata.');
    console.log('Agents will now use the iconURL defined in librechat.yaml.');
    console.log('This ensures icons work consistently across all instances!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
clearOpenAIAvatars();