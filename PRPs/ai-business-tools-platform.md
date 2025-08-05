name: "AI Business Tools Platform - LibreChat Customization"
description: |

## Purpose
Customize a self-hosted LibreChat instance to serve as a business tools platform, configuring specialized agents and endpoints while simplifying the interface for non-technical business users. Focus on LibreChat's native capabilities rather than building custom solutions.

## Core Principles
1. **Context is King**: Include ALL necessary documentation, examples, and caveats
2. **Validation Loops**: Provide executable tests/checks the AI can run and fix
3. **Information Dense**: Use keywords and patterns from the codebase
4. **Progressive Success**: Start simple, validate, then enhance
5. **Global rules**: Follow all rules in CLAUDE.md, especially LibreChat customization patterns

---

## Goal
Deploy a local LibreChat instance customized for business use, with pre-configured agents serving as specialized business tools. Users select "Business Tools" (renamed from Agents) like "Dark JK Coach" or "Hybrid Offer Printer" without seeing technical details. Leverage LibreChat's built-in authentication for free/premium user tiers.

## Why
- **Business value**: ~60 beta users need streamlined AI business tools without complexity
- **Integration**: Uses LibreChat's proven architecture and multi-user system
- **Problems solved**: Self-hosted privacy, simplified interface, tier-based tool access

## What
A customized LibreChat deployment with:
- Modified UI showing business tool names instead of technical terms
- Dark JK Coach: Business coaching agent using GPT-4o with vector store
- Hybrid Offer Creator: Sales letter generation using Claude with artifacts
- LibreChat's built-in auth with custom tier metadata (free/premium/admin)
- Simplified interface hiding model selection and technical parameters
- Local Docker deployment for business owner control

### Success Criteria
- [ ] LibreChat running locally with Docker
- [ ] UI customized to show "Business Tools" instead of technical terms
- [ ] Dark JK Coach agent working with vector store
- [ ] Hybrid Offer Creator generating 1500+ word documents
- [ ] User tiers (free/premium) controlling tool access
- [ ] Technical settings hidden from non-admin users
- [ ] Conversation history persisting across sessions

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://www.librechat.ai/docs/configuration/librechat_yaml
  why: Complete configuration reference for endpoints and UI
  
- url: https://www.librechat.ai/docs/features/agents
  why: Agent configuration and capabilities
  
- url: https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/interface
  why: UI customization options in librechat.yaml
  
- url: https://www.librechat.ai/docs/configuration/dotenv
  why: Environment variable configuration
  
- url: https://github.com/danny-avila/LibreChat/tree/main/client/src
  why: React frontend structure for UI customization
  
- file: examples/darkjk-prd.md
  why: Dark JK Coach implementation details
  
- file: examples/hybrid-offer-prd.md
  why: Hybrid Offer Creator implementation details
  
- file: CLAUDE.md
  why: LibreChat customization standards and patterns
  
- url: https://github.com/danny-avila/LibreChat/blob/main/docker-compose.yml
  why: Docker deployment reference
```

### Current Codebase tree
```bash
.
├── examples/
│   ├── darkjk-prd.md
│   ├── hybrid-offer-prd.md
│   └── librechat-configs/
│       └── basic-endpoint.yaml
├── PRPs/
│   └── templates/
│       └── prp_base.md
├── INITIAL.md
├── CLAUDE.md
└── README.md
```

### Desired Codebase tree with files to be added
```bash
.
├── LibreChat/                        # Cloned LibreChat repo
│   ├── librechat.yaml               # Main configuration
│   ├── .env                         # Environment variables
│   ├── docker-compose.override.yml  # Custom Docker config
│   ├── client/
│   │   └── src/
│   │       ├── localization/
│   │       │   └── custom-en.json  # Business terminology
│   │       └── components/
│   │           └── Nav/
│   │               └── CustomNav.jsx # Simplified navigation
│   └── api/
│       └── models/
│           └── User.js              # Extended with tier field
├── config/
│   ├── agents/
│   │   ├── darkjk-config.json      # Dark JK agent config
│   │   └── hybrid-offer-config.json # Hybrid Offer config
│   └── prompts/
│       ├── darkjk-system.md         # Dark JK system prompt
│       ├── hybrid-conversation.md   # Hybrid conversation prompt
│       └── hybrid-generation.md     # Hybrid generation prompt
├── scripts/
│   ├── setup.sh                     # Initial setup script
│   ├── configure-agents.js          # Agent configuration
│   ├── migrate-users.js             # User tier migration
│   └── backup.sh                    # MongoDB backup
├── docs/
│   ├── DEPLOYMENT.md                # Local deployment guide
│   ├── CUSTOMIZATION.md             # UI customization guide
│   └── USER-GUIDE.md                # Business user guide
└── tests/
    ├── test-agents.js               # Agent functionality tests
    └── test-access.js               # Tier-based access tests
```

### Known Gotchas & Library Quirks
```yaml
# CRITICAL: LibreChat UI customization requires rebuilding client
# CRITICAL: User tier stored as custom metadata in MongoDB user document
# CRITICAL: Agent builder visibility controlled by librechat.yaml + user role
# CRITICAL: Custom endpoints in librechat.yaml for model/tool isolation
# CRITICAL: Environment variables must be set before Docker compose
# CRITICAL: Vector store must exist in OpenAI before agent config
# CRITICAL: Artifacts need SANDPACK_BUNDLER_URL in production
# CRITICAL: Localization files override default UI text
# CRITICAL: MongoDB schema extensions need careful migration
```

## Implementation Blueprint

### Data models and structure

```yaml
# librechat.yaml structure
version: 1.0.5
cache: true

# UI Customization - Hide technical complexity
interface:
  endpointsMenu: true
  modelSelect: false      # Hide model selection
  parameters: false       # Hide technical parameters
  presets: true          # Allow business presets
  agents: true           # Show as "Business Tools"

# Disable public registration
registration:
  enabled: false         # Admin creates users manually

# Business tool agents
endpoints:
  agents:
    disableBuilder: true  # Hide from non-admin users
    recursionLimit: 50
    capabilities:
      - "file_search"
      - "artifacts"
      - "tools"
    
  # Custom endpoints for specialized tools
  custom:
    - name: "CoachingEndpoint"
      apiKey: "${OPENAI_API_KEY}"
      baseURL: "https://api.openai.com/v1"
      models:
        default: ["gpt-4o"]
      titleConvo: true
      modelDisplayLabel: "Business Coach"
      
    - name: "ContentEndpoint"
      apiKey: "${ANTHROPIC_API_KEY}"
      baseURL: "https://api.anthropic.com"
      models:
        default: ["claude-3-5-sonnet-20241022", "claude-3-opus-20240229"]
      titleConvo: true
      modelDisplayLabel: "Content Creator"

# User tier extension
userSchema:
  tier:
    type: String
    enum: ['free', 'premium', 'admin']
    default: 'free'
```

### List of tasks to be completed

```yaml
Task 1: Setup LibreChat with Docker
CREATE setup.sh:
  - Clone LibreChat repository
  - Copy custom configuration files
  - Build Docker images with customizations
  - Initialize MongoDB with indexes
  
CREATE docker-compose.override.yml:
  - PATTERN: Extend LibreChat's docker-compose.yml
  - Add environment variables
  - Configure volumes for persistence
  - Set up local SSL if needed

Task 2: Configure LibreChat Settings
CREATE LibreChat/librechat.yaml:
  - PATTERN: Based on CLAUDE.md guidelines
  - Hide technical UI elements
  - Configure custom endpoints
  - Set agent capabilities
  - Define user registration settings
  
CREATE LibreChat/.env:
  - API keys for OpenAI and Anthropic
  - MongoDB connection string: mongodb+srv://dschwartz06:6ZMOgKoMsuYVq8Ub@sovereignai.fgbvfyn.mongodb.net/?retryWrites=true&appName=SovereignAI
  - Custom environment variables
  - SANDPACK_BUNDLER_URL for artifacts

Task 3: Customize UI Terminology
CREATE LibreChat/client/src/localization/custom-en.json:
  - PATTERN: Override LibreChat's default text
  - "Agents" → "Business Tools"
  - "Endpoints" → "Tool Categories"
  - "Model" → "Tool Type"
  - Simplify technical messages
  
MODIFY LibreChat/client/src/components/Nav/CustomNav.jsx:
  - Simplified navigation for business users
  - Hide technical options
  - Add business-friendly icons

Task 4: Extend User Model for Tiers
MODIFY LibreChat/api/models/User.js:
  - PATTERN: Extend Mongoose schema
  - Add tier field (free/premium/admin)
  - Add allowedEndpoints array
  - Add business metadata fields
  
CREATE LibreChat/api/middleware/tierAccess.js:
  - Check user tier for endpoint access
  - Filter available agents by tier
  - Return appropriate error messages

Task 5: Configure Business Tool Agents
CREATE config/agents/darkjk-config.json:
  - Agent definition for Dark JK Coach
  - GPT-4o configuration
  - Vector store settings
  - Access restrictions
  
CREATE config/agents/hybrid-offer-config.json:
  - Agent for Hybrid Offer Creator
  - Claude model configuration
  - Artifact capabilities
  - Document generation settings

Task 6: Implement Agent Setup Script
CREATE scripts/configure-agents.js:
  - PATTERN: Use LibreChat's database directly
  - Create agents from config files
  - Set proper permissions
  - Configure vector stores
  - Assign to appropriate endpoints

Task 7: User Migration and Management
CREATE scripts/migrate-users.js:
  - Import beta users to MongoDB
  - Set appropriate tiers
  - Configure allowed tools
  - Maintain conversation history
  
CREATE LibreChat/api/routes/admin.js:
  - Admin endpoints for user management
  - Tier assignment functionality
  - Tool access configuration

Task 8: Testing and Validation
CREATE tests/test-agents.js:
  - Test Dark JK Coach responses
  - Test Hybrid Offer generation
  - Verify vector store queries
  - Check artifact rendering
  
CREATE tests/test-access.js:
  - Test free vs premium access
  - Verify endpoint restrictions
  - Check UI element visibility
  - Test admin capabilities

Task 9: Documentation
CREATE docs/DEPLOYMENT.md:
  - Docker setup instructions
  - Environment configuration
  - SSL setup for local network
  - Backup procedures
  
CREATE docs/USER-GUIDE.md:
  - How to access business tools
  - Tool descriptions and use cases
  - Premium features explanation
  - Support contacts
```

### Per task pseudocode

```javascript
// Task 4: Extend User Model
// LibreChat/api/models/User.js
const userSchema = new Schema({
  // ... existing LibreChat fields ...
  
  // Business platform extensions
  tier: {
    type: String,
    enum: ['free', 'premium', 'admin'],
    default: 'free'
  },
  allowedEndpoints: [{
    type: String
  }],
  businessMetadata: {
    company: String,
    industry: String,
    joinedDate: Date,
    lastToolUsed: String
  }
});

// Middleware for tier-based access
userSchema.methods.canAccessEndpoint = function(endpointName) {
  // PATTERN: LibreChat access control
  if (this.role === 'admin') return true;
  
  if (this.tier === 'premium') {
    return ['CoachingEndpoint', 'ContentEndpoint'].includes(endpointName);
  }
  
  // Free users - limited access
  return ['ContentEndpoint'].includes(endpointName);
};

// Task 6: Configure Agents
async function configureAgents() {
  // PATTERN: Direct MongoDB connection like LibreChat
  const db = await connectDb();
  
  // Read Dark JK configuration
  const darkJKConfig = JSON.parse(
    fs.readFileSync('./config/agents/darkjk-config.json')
  );
  
  // CRITICAL: Merge with system prompt
  darkJKConfig.instructions = fs.readFileSync(
    './config/prompts/darkjk-system.md', 'utf8'
  );
  
  // Set tier restrictions
  darkJKConfig.metadata = {
    requiredTier: 'premium',
    category: 'coaching',
    displayName: 'Dark JK Business Coach'
  };
  
  // GOTCHA: LibreChat stores agents in assistants collection
  await db.collection('assistants').updateOne(
    { name: darkJKConfig.name },
    { $set: darkJKConfig },
    { upsert: true }
  );
}

// Task 3: UI Customization
// custom-en.json
{
  "com.ui.agents": "Business Tools",
  "com.ui.endpoint": "Tool Category", 
  "com.ui.model": "Tool Type",
  "com.ui.newChat": "Start New Session",
  "com.ui.parameters": "Settings",
  "com.nav.agents": "Business Tools",
  "com.error.premium": "This tool requires a Premium subscription"
}
```

### Integration Points
```yaml
DATABASE:
  - MongoDB: Extended user schema, agent configs
  - Collections: users, assistants, conversations
  
CONFIGURATION:
  - librechat.yaml: UI settings, endpoints, capabilities
  - .env: API keys, database URLs, custom settings
  - Localization: Custom business terminology
  - MongoDB Atlas: mongodb+srv://dschwartz06:6ZMOgKoMsuYVq8Ub@sovereignai.fgbvfyn.mongodb.net/?retryWrites=true&appName=SovereignAI
  
CUSTOMIZATION:
  - UI Components: Simplified navigation and tool selection
  - User Model: Tier field and access methods
  - Middleware: Tier-based endpoint filtering
  
DOCKER:
  - docker-compose.override.yml: Custom volumes and env
  - Dockerfile.custom: UI build with customizations
  - SSL Config: nginx for local HTTPS
```

## Validation Loop

### Level 1: Configuration Validation
```bash
# Validate YAML syntax
yamllint LibreChat/librechat.yaml

# Check all required files exist
./scripts/check-setup.sh

# Verify environment variables
source LibreChat/.env && env | grep -E "(OPENAI|ANTHROPIC|MONGO)"

# Expected: All configs valid, files present
```

### Level 2: Docker Deployment
```bash
# Build and start services
cd LibreChat
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

# Check service health
docker-compose ps
curl -k https://localhost:443/health

# Check MongoDB Atlas connection
docker exec librechat-app mongosh "mongodb+srv://dschwartz06:6ZMOgKoMsuYVq8Ub@sovereignai.fgbvfyn.mongodb.net/?retryWrites=true&appName=SovereignAI" --eval "db.serverStatus()"

# Expected: All services healthy
```

### Level 3: UI Customization Tests
```bash
# Check custom localization loaded
curl -k https://localhost:443/api/config | jq '.interface'

# Verify UI text changes
# Should see "Business Tools" not "Agents"
grep -r "Business Tools" LibreChat/client/dist/

# Test navigation customization
# Non-admin user should not see agent builder
```

### Level 4: Agent Functionality
```javascript
// Test Dark JK Coach
describe('Dark JK Coach', () => {
  test('premium users can access', async () => {
    const user = await createUser({ tier: 'premium' });
    const response = await queryAgent(user, 'darkjk', 'Help with pricing');
    expect(response.status).toBe(200);
    expect(response.tools_used).toContain('file_search');
  });
  
  test('free users blocked', async () => {
    const user = await createUser({ tier: 'free' });
    const response = await queryAgent(user, 'darkjk', 'Help');
    expect(response.status).toBe(403);
    expect(response.error).toContain('Premium subscription');
  });
});

// Test Hybrid Offer Creator
describe('Hybrid Offer Creator', () => {
  test('generates document in artifact', async () => {
    const user = await createUser({ tier: 'premium' });
    const result = await completeOfferFlow(user, offerData);
    expect(result.artifact).toBeDefined();
    expect(result.wordCount).toBeGreaterThan(1500);
  });
});
```

### Level 5: End-to-End Business Flow
```bash
# Full user journey test
./tests/e2e-business-flow.sh

# Tests:
# 1. Admin creates new user
# 2. User logs in, sees simplified UI
# 3. Free user sees limited tools
# 4. Admin upgrades to premium
# 5. Premium user accesses all tools
# 6. Tools generate expected outputs
# 7. Conversation history persists

# Expected: All steps pass
```

## Final Validation Checklist
- [ ] LibreChat running locally with Docker
- [ ] UI shows "Business Tools" instead of "Agents"
- [ ] Model selection hidden from users
- [ ] Dark JK Coach accessible to premium users only
- [ ] Hybrid Offer Creator generates artifacts
- [ ] Free users see limited tool set
- [ ] Admin can manage user tiers
- [ ] Conversation history persists
- [ ] Custom localization working
- [ ] SSL configured for local network
- [ ] MongoDB data persisting in volumes
- [ ] ~60 beta users successfully migrated

---

## Anti-Patterns to Avoid
- ❌ Don't build separate frontend - customize LibreChat's React app
- ❌ Don't create custom auth - use LibreChat's built-in system
- ❌ Don't modify core LibreChat logic - use configuration and extensions
- ❌ Don't expose technical settings to business users
- ❌ Don't skip Docker - it simplifies deployment and updates
- ❌ Don't hardcode business logic - use configuration files
- ❌ Don't forget to backup MongoDB before migrations

## Confidence Score: 9/10

High confidence due to:
- Following LibreChat's established patterns
- Using configuration over custom code
- Leveraging built-in multi-user system
- Clear customization points in LibreChat
- Well-documented UI customization options

Slight uncertainty on:
- Exact MongoDB schema extension approach (may need minor adjustments)
- UI component override specifics (depends on LibreChat version)

This implementation follows CLAUDE.md principles by customizing LibreChat rather than replacing it, using its built-in features for authentication and user management, and focusing on configuration-driven changes that survive updates.