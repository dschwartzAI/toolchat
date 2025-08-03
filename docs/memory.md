# Always-On Memory System for LibreChat Business Tools

## FEATURE:
Implement LibreChat's native memory system with automatic enablement for all users. The memory system provides persistent storage of user information across ALL conversations and agents, building a comprehensive profile that enhances every interaction across the platform.

## EXAMPLES:
In the examples/ folder:
- examples/memory-flow.md - How memory builds across different agents
- examples/memory-schema.md - Database structure for memory entries
- examples/cross-agent-scenarios.md - Memory working across tools
- examples/memory-ui-disabled.md - Hiding memory UI while keeping functionality

## DOCUMENTATION:
- LibreChat Memory: https://www.librechat.ai/docs/features/memory
- Memory PR #7760: https://github.com/danny-avila/LibreChat/pull/7760
- Memory Configuration: https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/memory

## KEY UNDERSTANDING:
- Memory is USER-LEVEL, not conversation-level
- Memories persist across ALL conversations and agents
- Memory store is centralized and searchable
- Each memory entry includes context about where it was learned
- Users normally can view/edit/delete memories (we're hiding this)

## WHAT SUCCESS LOOKS LIKE:

### Scenario 1: Cross-Agent Memory
1. User tells Dark JK Coach: "I run a B2B SaaS agency"
2. Memory stores: business_type = "B2B SaaS agency"
3. User switches to Hybrid Offer Printer
4. Offer Printer already knows they run a B2B SaaS agency
5. User switches to DCM Tool
6. DCM also knows their business type without asking

### Scenario 2: Progressive Profile Building
- Day 1 (Dark JK): Learns business type and target audience
- Day 3 (Hybrid Offer): Learns pricing model and services
- Day 7 (DCM): Learns unique mechanism and success metrics
- Day 10 (Any agent): Has complete business context

### Scenario 3: Contextual Memory Updates
- Week 1: "I charge $5K for my consulting"
- Week 4: "I've raised my prices to $8K"
- Memory updates across all agents immediately
- All future conversations use updated pricing

## IMPLEMENTATION REQUIREMENTS:

### 1. LibreChat Configuration

```yaml
version: 1.2.7
cache: true

# Hide interface elements including memory management
interface:
  sidePanel: false  # Hides memory toggle and viewer
  # ... other interface settings

# Always-on memory configuration
memory:
  disabled: false          # Memory system enabled
  personalize: false       # No user toggle - always on
  tokenLimit: 5000        # Increased for richer profiles
  messageWindowSize: 5    # Analyze last 5 messages
  validKeys:
    # Business Profile
    - "business_type"
    - "company_name"
    - "industry"
    - "years_in_business"
    - "team_size"
    - "monthly_revenue"
    
    # Target Audience
    - "target_audience"
    - "ideal_client"
    - "client_pain_points"
    - "client_budget_range"
    
    # Products & Services
    - "services_offered"
    - "products"
    - "pricing_model"
    - "average_deal_size"
    
    # Unique Value
    - "unique_mechanism"
    - "methodology"
    - "success_metrics"
    - "case_studies"
    
    # Goals & Challenges
    - "business_goals"
    - "current_challenges"
    - "growth_targets"
    
    # Tools & Systems
    - "tools_used"
    - "tech_stack"
    - "marketing_channels"
    
  agent:
    provider: "openAI"
    model: "gpt-4o-mini"
    instructions: |
      Build comprehensive user profiles by remembering:
      
      BUSINESS FUNDAMENTALS:
      - Company details and structure
      - Industry and market position
      - Team size and revenue metrics
      
      CLIENT INSIGHTS:
      - Target audience demographics
      - Client pain points and needs
      - Budget ranges and buying behavior
      
      OFFERINGS:
      - Services and products offered
      - Pricing strategies and models
      - Unique methodologies or systems
      
      STRATEGIC CONTEXT:
      - Business goals and growth targets
      - Current challenges and obstacles
      - Success stories and metrics
      
      OPERATIONAL:
      - Tools and platforms used
      - Marketing and sales approaches
      
      GUIDELINES:
      - Store information that enhances coaching quality
      - Update when users provide new information
      - Maintain context about when/where learned
      - Focus on actionable business intelligence

      2. Memory Store Structure
Each memory entry in the database:
javascript{
  userId: "user_123",
  key: "business_type",
  content: "B2B SaaS consulting agency specializing in RevOps",
  conversationId: "conv_abc123",  // Where this was learned
  agentId: "darkjk_coach",        // Which agent learned it
  timestamp: "2024-03-20T10:30:00Z",
  lastUpdated: "2024-03-25T14:20:00Z"
}
3. Cross-Agent Memory Flow
mermaidgraph LR
    A[User] --> B[Dark JK Coach]
    A --> C[Hybrid Offer]
    A --> D[DCM Tool]
    
    B --> E[Memory Store]
    C --> E
    D --> E
    
    E --> B
    E --> C
    E --> D
    
    style E fill:#f9f,stroke:#333,stroke-width:4px