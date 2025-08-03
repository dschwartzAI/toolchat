FEATURE:

LibreChat-based platform with custom tool selection sidebar that hides all technical complexity
Two specialized business tools: DarkJK Coach (GPT-4o with vector store) and Hybrid Offer Printer (Claude with artifacts)
Custom React sidebar component that replaces LibreChat's native interface
Tool-specific agent configurations with different models and settings
Premium access control with user tier management
Persistent conversation context per tool
Zero visible configuration options for end users

EXAMPLES:
In the examples/ folder:

examples/darkjk-prd.md - Complete PRD for DarkJK Business Coach implementation showing agent configuration, system prompts, and vector store integration
examples/hybrid-offer-prd.md - Complete PRD for Hybrid Offer Printer showing conversation flow, dual-model strategy, and Google Docs export
examples/librechat-configs/ - [TO BE ADDED] Working LibreChat configuration examples
examples/ui-components/ - [TO BE ADDED] Custom React components for simplified UI
examples/tool-implementations/ - [TO BE ADDED] Reference implementations of similar tools

Read the PRD files to understand the complete tool specifications and implementation requirements.
DOCUMENTATION:

LibreChat Configuration: https://docs.librechat.ai/install/configuration/
LibreChat Custom Endpoints: https://docs.librechat.ai/install/configuration/endpoints
LibreChat Override Config: https://docs.librechat.ai/install/configuration/librechat_yaml.html
LibreChat Environment Variables: https://docs.librechat.ai/install/configuration/dotenv.html
OpenAI Assistants API: https://platform.openai.com/docs/assistants (for DarkJK)
Claude API: https://docs.anthropic.com/claude/reference (for Hybrid Offer)
Google Docs API: https://developers.google.com/docs/api (for export functionality)

OTHER CONSIDERATIONS:

LibreChat sidebar initialization has been problematic in previous attempts
Must work within LibreChat's existing architecture without breaking core functionality
Need custom React components to override default UI elements
Each tool requires different model providers (OpenAI vs Anthropic)
Tools must maintain separate conversation contexts without cross-contamination
Premium features require database schema for user tier tracking
Success = non-technical users can switch tools without seeing any AI/technical settings
Use Firecrawl MCP server to research LibreChat UI customization approaches
May need to fork LibreChat if override methods are insufficient
Include setup instructions for both development and production environments