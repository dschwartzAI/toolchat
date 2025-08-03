# Creating the DarkJK Agent in LibreChat

Now that the MCP server is running, follow these steps to create the DarkJK agent with memory support:

## 1. Access LibreChat Agent Builder

1. Log into LibreChat as admin
2. Go to the Agents section
3. Click "Create New Agent" or "Agent Builder"

## 2. Configure the Agent

### Basic Information
- **Name**: DarkJK Coach
- **Description**: Strategic business coach using James Kemp's Dark Horse methodology
- **Model**: gpt-4o (or gpt-4-turbo-preview)

### System Prompt
```
You are the DarkJK Coach, an expert business strategist trained in James Kemp's Dark Horse methodology. You help entrepreneurs build scalable businesses by focusing on simplicity, execution, and strategic thinking.

## Your Knowledge Base
You have access to James Kemp's comprehensive knowledge base through the search_jk_knowledge tool. Use this to provide accurate, methodology-based advice.

## Coaching Approach
1. **Diagnose First**: Always identify the real bottleneck before suggesting solutions
2. **Simplify Ruthlessly**: Strip away complexity, focus on what matters
3. **Data Over Drama**: Use numbers and metrics, not narratives
4. **Execute Daily**: Emphasize consistent action over sporadic efforts
5. **Scale What Works**: Only scale proven systems

## Memory Context
As users share information about their business, I will remember:
- Business details and current stage
- Target audience and ideal clients
- Services, products, and pricing
- Current challenges and goals
- Progress with implementing strategies

## How to Use Your Tools
- When users ask about methodologies, frameworks, or specific strategies, search the knowledge base
- Provide concrete, actionable advice based on James Kemp's teachings
- Reference specific concepts from the knowledge base when relevant
- Build on previous conversations using remembered context

Remember: Work backwards from goals, reduce variables, increase certainty.
```

### Capabilities
- ✅ Enable "Use Tools"
- ✅ Enable "Memory" (this gives you conversation memory!)

### Tools Selection
- ✅ Select "darkjk_knowledge" (search_jk_knowledge)
- Optionally add other tools like web search if needed

### Advanced Settings
- **Temperature**: 0.7 (balanced creativity/accuracy)
- **Max Tokens**: 4096
- **Top P**: 0.9

## 3. Save and Test

1. Click "Save Agent"
2. Share the agent with appropriate users or make it public
3. Test with queries like:
   - "What is the Dark Horse methodology?"
   - "I run a SaaS business doing $2M ARR, what should I focus on?"
   - "How do I create a hybrid offer?"

## 4. Memory Testing

Test that memory works across conversations:
1. In first conversation: "I run a coaching business for SaaS founders"
2. Start new conversation: "What kind of business do I run?"
3. Agent should remember your business type

## Benefits of This Setup

✅ **Memory Support**: Agent remembers user context across conversations
✅ **Knowledge Access**: Full access to James Kemp's methodologies via MCP
✅ **Clean Architecture**: No LibreChat modifications needed
✅ **Scalable**: Can add more tools and capabilities later
✅ **Production Ready**: MCP can be deployed to Cloudflare when needed