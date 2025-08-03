const { z } = require('zod');
const { tool } = require('@langchain/core/tools');
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Vector store ID for DarkJK knowledge base
const VECTOR_STORE_ID = 'vs_67df294659c48191bffbe978d27fc6f7';

/**
 * Tool for searching the DarkJK knowledge base using OpenAI's vector store
 */
const searchKnowledgeBase = tool(
  async ({ query, max_results = 5 }) => {
    try {
      // Create a thread for the search
      const thread = await openai.beta.threads.create({
        messages: [
          {
            role: 'user',
            content: query,
          },
        ],
      });

      // Create an assistant specifically for searching
      const searchAssistant = await openai.beta.assistants.create({
        name: 'Knowledge Base Search',
        instructions: 'Search the knowledge base and return relevant information.',
        model: 'gpt-4-turbo-preview',
        tools: [{ type: 'file_search' }],
        tool_resources: {
          file_search: {
            vector_store_ids: [VECTOR_STORE_ID],
          },
        },
      });

      // Run the assistant
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: searchAssistant.id,
      });

      // Wait for completion
      let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      while (runStatus.status !== 'completed' && runStatus.status !== 'failed') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      }

      if (runStatus.status === 'failed') {
        throw new Error('Search failed: ' + runStatus.last_error?.message);
      }

      // Get the messages
      const messages = await openai.beta.threads.messages.list(thread.id);
      
      // Extract the assistant's response
      const assistantMessages = messages.data.filter(msg => msg.role === 'assistant');
      if (assistantMessages.length === 0) {
        return 'No results found for your query.';
      }

      // Clean up - delete the temporary assistant
      await openai.beta.assistants.del(searchAssistant.id);

      // Return the search results
      const results = assistantMessages[0].content
        .filter(content => content.type === 'text')
        .map(content => content.text.value)
        .join('\n\n');

      return results || 'No relevant information found.';
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      return `Error searching knowledge base: ${error.message}`;
    }
  },
  {
    name: 'search_knowledge_base',
    description: 'Search the DarkJK knowledge base for relevant information about James Kemp methodologies, Dark Horse strategies, and business coaching content.',
    schema: z.object({
      query: z.string().describe('The search query to find relevant information in the knowledge base'),
      max_results: z.number().optional().describe('Maximum number of results to return (default: 5)'),
    }),
  }
);

module.exports = { searchKnowledgeBase };