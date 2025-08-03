AI Business Tools Platform
FEATURE:

LibreChat deployment where users select pre-built business tools via LibreChat's native agent selector
Admin creates specialized agents that serve as business tools with hidden technical complexity
Dark JK Coach: Business coaching agent using OpenAI with James Kemp's vector store content
Hybrid Offer Printer: Sales letter generator using Claude with artifact output (1500+ words)
Each agent has pre-configured model, temperature, prompts, and capabilities
Users only see agent selector and chat interface - no model names or technical settings
Memory system maintains user business context across conversations
Future: Google Docs export via OAuth integration
Clean architecture using LibreChat defaults instead of custom Supabase integration
Production configuration hides agent builder from regular users

EXAMPLES:
In the examples/ folder:

examples/hybrid-offer-prd.md - Complete PRD for Hybrid Offer Creator with conversation flow and document generation specs
examples/n8n-workflow.json - Original N8N implementation showing offer generation logic
examples/agent-prompts/darkjk-coach.md - System prompts and behavior for Dark JK Coach
examples/agent-prompts/hybrid-offer.md - Complete conversation and generation prompts
examples/librechat-configs/ - [TO BE ADDED] Production librechat.yaml examples
examples/agent-exports/ - [TO BE ADDED] Exportable agent configurations

Read the PRD files for complete implementation specifications.
DOCUMENTATION:

LibreChat Agents: https://www.librechat.ai/docs/features/agents
Agent Configuration: https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/agents
File Search (Vector Stores): https://www.librechat.ai/docs/features/agents#file-search
Artifacts: https://www.librechat.ai/docs/features/artifacts
OpenAI Assistants API: https://platform.openai.com/docs/assistants
Anthropic Claude: https://docs.anthropic.com/claude/docs
MCP Servers: https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/mcp_servers

OTHER CONSIDERATIONS:

Fresh LibreChat installation using default MongoDB/PostgreSQL
Admin account builds all agents with full configuration access
Production users see only agent selector via agents.disableBuilder: true
Dark JK Coach requires connecting existing OpenAI vector store
Hybrid Offer needs artifacts enabled with proper markdown rendering
Agent Chain feature may have issues in demo environment (consider single agent approach)
Each agent maintains separate conversation memory and context
~60 beta users to migrate from previous custom implementation
Success = users select "Dark JK Coach" or "Hybrid Offer Printer" without seeing GPT-4/Claude
Google Docs export requires OpenAPI Action or MCP server implementation
Consider usage limits per tool based on user tier
Ensure proper error handling when vector store queries fail
Plan for scaling to more tools without UI complexity