import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const ASSISTANT_ID = 'asst_2O5apCR6JYRAzrpm544hj4YM';

async function testVectorStoreSearch() {
  console.log('Testing DarkJK vector store search...\n');

  try {
    // Test query
    const query = 'What is the Dark Horse methodology?';
    console.log(`Query: ${query}\n`);

    // Create a thread
    const thread = await openai.beta.threads.create();
    console.log(`Created thread: ${thread.id}`);

    // Add message
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: query,
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
    });
    console.log(`Started run: ${run.id}`);

    // Wait for completion
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      console.log(`Status: ${runStatus.status}`);
    }

    if (runStatus.status !== 'completed') {
      throw new Error(`Run failed: ${runStatus.status}`);
    }

    // Get messages
    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = messages.data.find(msg => msg.role === 'assistant');

    if (assistantMessage) {
      console.log('\nResponse from DarkJK knowledge base:');
      console.log('=' .repeat(50));
      for (const content of assistantMessage.content) {
        if (content.type === 'text') {
          console.log(content.text.value);
        }
      }
      console.log('=' .repeat(50));
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testVectorStoreSearch();