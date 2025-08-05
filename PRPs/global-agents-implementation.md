name: "LibreChat Global Agents Implementation PRP"
description: |

## Purpose
Fork LibreChat and implement a global agents feature that allows administrators to create agents visible to all users, enabling the business tools platform use case where Dark JK Coach and Hybrid Offer Creator are available system-wide.

## Fork Setup Requirements
This implementation requires forking the official LibreChat repository since it involves core functionality changes that are specific to the business tools platform use case.

### Fork Setup Steps
```bash
# 1. Fork LibreChat on GitHub (via GitHub UI)
# Go to https://github.com/danny-avila/LibreChat
# Click "Fork" button

# 2. Clone your fork
git clone https://github.com/YOUR-USERNAME/LibreChat.git
cd LibreChat

# 3. Add upstream remote
git remote add upstream https://github.com/danny-avila/LibreChat.git

# 4. Create feature branch
git checkout -b feature/global-agents

# 5. Keep fork updated
git fetch upstream
git merge upstream/main
```

### Current Repository Structure
Your current setup shows:
- Remote: https://github.com/dschwartzAI/darkjk.git
- This is NOT a fork of LibreChat

### Required Fork Migration Steps
```bash
# 1. First, save your current modifications
cd /Users/danielschwartz/jk-ai/jk-ai
tar -czf librechat-modifications-backup.tar.gz LibreChat/

# 2. Fork LibreChat on GitHub
# Go to https://github.com/danny-avila/LibreChat
# Click "Fork" button to create: github.com/dschwartzAI/LibreChat

# 3. Clone the proper fork
cd /Users/danielschwartz/jk-ai/jk-ai
mv LibreChat LibreChat-old
git clone https://github.com/dschwartzAI/LibreChat.git
cd LibreChat

# 4. Set up upstream remote
git remote add upstream https://github.com/danny-avila/LibreChat.git
git fetch upstream

# 5. Create feature branch for your modifications
git checkout -b feature/business-tools-platform

# 6. Copy over your modifications
cp -r ../LibreChat-old/.env .
cp -r ../LibreChat-old/docker-compose.override.yml .
cp -r ../LibreChat-old/config/ .
# ... copy other modified files

# 7. Commit your existing modifications
git add .
git commit -m "feat: Add business tools platform modifications"

# 8. Create global agents branch
git checkout -b feature/global-agents

# 9. Push to your fork
git push origin feature/business-tools-platform
git push origin feature/global-agents
```

### Maintaining Your Fork
```bash
# Regularly sync with upstream
git checkout main
git fetch upstream
git merge upstream/main
git push origin main

# Rebase your features on latest
git checkout feature/global-agents
git rebase main
```

## Core Principles
1. **Fork Maintainable**: Keep changes isolated for easy upstream merges
2. **Backward Compatible**: Don't break existing personal agents
3. **Permission Based**: Only admins can create/edit global agents
4. **Database Efficient**: Minimal schema changes
5. **UI Intuitive**: Clear distinction between personal and global agents
6. **Follow LibreChat Patterns**: Use existing code patterns and conventions

---

## Goal
Enable administrators to create and manage agents that are:
- Visible to all users in the system
- Not editable by regular users
- Clearly marked as "System" or "Global" agents
- Can use all agent capabilities (RAG, artifacts, etc.)
- Optionally hide personal agents for business deployments

## Why
- **Business Tools Platform**: Required for shared business tools like Dark JK Coach
- **Consistency**: All users get the same agent configurations
- **Management**: Centralized control over business-critical agents
- **User Experience**: Users don't need to recreate complex agents

## What
### User-Visible Changes
- Global agents appear in agent selector with special badge/icon
- Admin panel for managing global agents
- Toggle in config to show only global agents
- Clear visual distinction between personal and global agents

### Technical Implementation
- New `isGlobal` field in Agent model
- Admin-only API endpoints for global agent management
- Modified agent queries to include global agents
- Configuration options in librechat.yaml

### Success Criteria
- [ ] Admins can create agents visible to all users
- [ ] Regular users cannot edit/delete global agents
- [ ] Global agents work with all features (RAG, artifacts)
- [ ] Clear UI distinction between agent types
- [ ] No performance degradation
- [ ] Backward compatibility maintained

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- file: /api/models/Agent.js
  why: Current Agent schema that needs modification
  
- file: /api/server/services/Agents/
  why: Agent service layer that handles CRUD operations
  
- file: /api/server/routes/agents/
  why: API endpoints for agent management
  
- file: /client/src/hooks/Agents/
  why: Frontend hooks for agent data fetching
  
- file: /api/models/User.js
  why: User model to understand role system
  
- url: https://www.librechat.ai/docs/configuration/librechat_yaml
  why: Configuration system for feature flags

- file: /api/server/middleware/
  why: Authorization middleware patterns
  
- file: /client/src/components/SidePanel/Agents/
  why: UI components for agent selection
```

### Current Codebase Structure
```
LibreChat/
├── api/
│   ├── models/
│   │   ├── Agent.js              # Agent schema
│   │   ├── Agent.spec.js         # Agent tests
│   │   └── User.js               # User schema with roles
│   └── server/
│       ├── routes/
│       │   └── agents/
│       │       ├── index.js      # Agent routes
│       │       └── v1.js         # Agent API v1
│       ├── services/
│       │   └── Agents/
│       │       └── index.js      # Agent service layer
│       └── middleware/
│           └── requireJwtAuth.js # Auth middleware
└── client/
    └── src/
        ├── hooks/
        │   └── Agents/
        │       ├── useAgents.ts   # Agent data fetching
        │       └── useCreateAgent.ts
        └── components/
            └── SidePanel/
                └── Agents/        # Agent UI components
```

### Known Gotchas & Patterns
```javascript
// CRITICAL: LibreChat patterns to follow

// 1. Agent Model uses mongoose discriminators
// Current: Agent.discriminator('Agent', AgentSchema)
// Need to add: isGlobal, createdBy fields

// 2. Service layer pattern for data access
// All DB operations go through /api/server/services/

// 3. Frontend uses React Query for data fetching
// Hooks in /client/src/hooks/ manage cache

// 4. Role-based access uses middleware
// Pattern: requireJwtAuth + role check

// 5. Real-time updates use socket.io
// Global agent changes need to broadcast to all users
```

## Implementation Blueprint

### Data Models and Structure

```javascript
// api/models/Agent.js modifications
const AgentSchema = new Schema({
  // ... existing fields ...
  
  // New fields for global agents
  isGlobal: {
    type: Boolean,
    default: false,
    index: true  // For efficient filtering
  },
  createdBy: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  // For business metadata
  metadata: {
    tier: {
      type: String,
      enum: ['free', 'premium', 'all'],
      default: 'all'
    },
    category: String,
    icon: String,
    order: Number  // Display order for global agents
  }
});

// Compound index for efficient queries
AgentSchema.index({ user: 1, isGlobal: 1 });
AgentSchema.index({ isGlobal: 1, 'metadata.order': 1 });
```

### List of Tasks to Complete

```yaml
Task 1: Modify Agent Model
MODIFY api/models/Agent.js:
  - ADD isGlobal field with default false
  - ADD createdBy field referencing User
  - ADD metadata object for business properties
  - ADD compound indexes for performance
  - UPDATE validation to ensure global agents have required metadata

Task 2: Create Global Agent Service Methods
CREATE api/server/services/Agents/global.js:
  - IMPLEMENT getGlobalAgents() method
  - IMPLEMENT createGlobalAgent() with admin check
  - IMPLEMENT updateGlobalAgent() with permission validation
  - IMPLEMENT deleteGlobalAgent() with cascade handling
  - ADD caching for global agents list

Task 3: Update Agent Query Logic
MODIFY api/server/services/Agents/index.js:
  - UPDATE getAgents() to include global agents
  - ADD filtering logic based on user tier
  - MODIFY delete to prevent global agent deletion by non-admins
  - ADD method to check if agent is editable by user

Task 4: Create Admin API Endpoints
CREATE api/server/routes/agents/admin.js:
  - POST /api/agents/global - Create global agent
  - PUT /api/agents/global/:id - Update global agent
  - DELETE /api/agents/global/:id - Delete global agent
  - GET /api/agents/global - List all global agents
  - ADD requireAdmin middleware to all routes

Task 5: Update Frontend Hooks
MODIFY client/src/hooks/Agents/useAgents.ts:
  - UPDATE query to fetch both personal and global agents
  - ADD separation logic for UI display
  - ADD isEditable flag to agent objects
  - IMPLEMENT optimistic updates for admin actions

Task 6: Create Global Agent UI Components
CREATE client/src/components/Admin/GlobalAgents/:
  - GlobalAgentManager.tsx - Main admin interface
  - GlobalAgentForm.tsx - Create/edit form
  - GlobalAgentList.tsx - List with actions
  - ADD to admin panel navigation

Task 7: Update Agent Selector UI
MODIFY client/src/components/SidePanel/Agents/:
  - ADD visual distinction for global agents (badge/icon)
  - DISABLE edit/delete buttons for global agents (non-admin)
  - ADD "System" or "Global" label
  - SORT global agents first with custom order

Task 8: Add Configuration Options
MODIFY librechat.yaml schema:
  - ADD agents.showOnlyGlobal option
  - ADD agents.globalAgentLabel option
  - ADD agents.allowPersonalAgents option
  - UPDATE validation schema

Task 9: Implement Real-time Updates
MODIFY api/server/socket.io:
  - ADD global agent change events
  - BROADCAST updates to all connected users
  - IMPLEMENT cache invalidation on changes
  - ADD event handlers in frontend

Task 10: Add Migration Script
CREATE api/server/migrations/global-agents.js:
  - MIGRATE existing shared agents if any
  - SET isGlobal: false for all existing agents
  - CREATE indexes for new fields
  - ADD rollback capability
```

### Per Task Implementation Details

```javascript
// Task 2: Global Agent Service Implementation
// api/server/services/Agents/global.js

const { Agent } = require('~/models');
const { CacheKeys, getLogStores } = require('~/cache');

/**
 * Get all global agents, with caching
 */
async function getGlobalAgents(options = {}) {
  const { tier = 'all' } = options;
  const cache = getLogStores(CacheKeys.GLOBAL_AGENTS);
  
  // Check cache first
  const cacheKey = `global_agents:${tier}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;
  
  // Query with tier filtering
  const query = { isGlobal: true };
  if (tier !== 'all') {
    query['metadata.tier'] = { $in: [tier, 'all'] };
  }
  
  const agents = await Agent.find(query)
    .sort({ 'metadata.order': 1, createdAt: 1 })
    .lean();
  
  // Cache for 5 minutes
  await cache.set(cacheKey, agents, 300000);
  return agents;
}

// Task 5: Frontend Hook Modifications
// client/src/hooks/Agents/useAgents.ts

export function useAgents() {
  const { data: user } = useAuthUser();
  
  return useQuery({
    queryKey: ['agents', user?.id],
    queryFn: async () => {
      const [personal, global] = await Promise.all([
        fetchPersonalAgents(),
        fetchGlobalAgents()
      ]);
      
      // Mark agents as editable
      const personalWithFlags = personal.map(a => ({
        ...a,
        isEditable: true,
        isGlobal: false
      }));
      
      const globalWithFlags = global.map(a => ({
        ...a,
        isEditable: user?.role === 'admin',
        isGlobal: true
      }));
      
      // Global agents first, then personal
      return [...globalWithFlags, ...personalWithFlags];
    }
  });
}
```

### Integration Points
```yaml
DATABASE:
  - migration: Add isGlobal, createdBy, metadata to agents collection
  - indexes: Create compound indexes for performance
  
API:
  - routes: New /api/agents/global/* endpoints
  - middleware: requireAdmin for global agent management
  - events: Socket.io broadcasts for real-time updates
  
FRONTEND:
  - components: New admin UI for global agent management
  - hooks: Modified data fetching to include global agents
  - state: React Query cache invalidation on updates
  
CONFIG:
  - librechat.yaml: New agent display options
  - permissions: Role-based access control
```

## Validation Loop

### Level 1: Unit Tests
```bash
# Run after implementing each component
npm run test:api -- --testPathPattern="Agent"
npm run test:client -- --testPathPattern="useAgents"

# New test files to create:
# - api/models/Agent.global.spec.js
# - api/server/services/Agents/global.spec.js
# - client/src/hooks/Agents/useGlobalAgents.spec.ts
```

### Level 2: Integration Tests
```javascript
// api/server/routes/agents/admin.spec.js
describe('Global Agent Admin API', () => {
  it('should create global agent as admin', async () => {
    const agent = await request(app)
      .post('/api/agents/global')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(mockGlobalAgent)
      .expect(201);
      
    expect(agent.body.isGlobal).toBe(true);
  });
  
  it('should reject global agent creation as regular user', async () => {
    await request(app)
      .post('/api/agents/global')
      .set('Authorization', `Bearer ${userToken}`)
      .send(mockGlobalAgent)
      .expect(403);
  });
});
```

### Level 3: E2E Tests
```typescript
// e2e/globalAgents.spec.ts
test('Admin can create global agent visible to all users', async ({ page }) => {
  // Login as admin
  await loginAsAdmin(page);
  
  // Create global agent
  await page.goto('/admin/agents');
  await page.click('[data-testid="create-global-agent"]');
  await fillAgentForm(page, globalAgentData);
  await page.click('[data-testid="save-agent"]');
  
  // Logout and login as regular user
  await logout(page);
  await loginAsUser(page);
  
  // Verify agent is visible but not editable
  await page.goto('/chat');
  await page.click('[data-testid="agent-selector"]');
  const agent = page.locator(`[data-agent-id="${globalAgentData.id}"]`);
  await expect(agent).toBeVisible();
  await expect(agent.locator('.global-badge')).toBeVisible();
  await expect(agent.locator('.edit-button')).toBeDisabled();
});
```

## Final Validation Checklist
- [ ] Global agents visible to all users
- [ ] Only admins can create/edit/delete global agents
- [ ] Clear visual distinction in UI
- [ ] RAG and artifacts work with global agents
- [ ] Performance acceptable with many global agents
- [ ] Real-time updates working across sessions
- [ ] Configuration options in librechat.yaml working
- [ ] Migration script handles existing data
- [ ] All tests passing
- [ ] No regression in personal agents

---

## Anti-Patterns to Avoid
- ❌ Don't modify personal agent queries unnecessarily
- ❌ Don't cache too aggressively (stale data issues)
- ❌ Don't allow users to override global agent settings
- ❌ Don't break existing agent API contracts
- ❌ Don't hardcode role checks - use middleware
- ❌ Don't forget to broadcast updates to all users

## Fork Management Strategy

### Why Fork?
1. **Core Feature Change**: Global agents require modifying core LibreChat functionality
2. **Business Specific**: This feature is specific to business tools platform use case
3. **Upstream Compatibility**: May not be accepted in main LibreChat repo
4. **Custom Needs**: Allows further business-specific customizations

### Fork Maintenance Plan
```yaml
Branching Strategy:
  main: Mirrors upstream LibreChat
  feature/business-tools-platform: All business customizations
  feature/global-agents: This specific feature
  production: Stable release branch

Update Cycle:
  - Weekly: Sync main with upstream
  - Monthly: Rebase features on main
  - Quarterly: Major update review

Conflict Resolution:
  - Isolate changes to minimize conflicts
  - Document all modifications
  - Use feature flags where possible
```

### Handling Upstream LibreChat Updates

#### When LibreChat Releases New Features
```bash
# 1. Fetch latest changes
git checkout main
git fetch upstream
git merge upstream/main

# 2. Check what's new
git log --oneline HEAD..upstream/main
git diff HEAD upstream/main --stat

# 3. Test compatibility
git checkout feature/global-agents
git rebase main --dry-run

# 4. If conflicts exist
git rebase main
# Resolve conflicts, focusing on:
# - api/models/Agent.js
# - api/server/routes/agents/
# - client/src/hooks/Agents/
```

#### Common Update Scenarios

**Scenario 1: LibreChat adds new agent features**
- Best case: Enhances your global agents
- Action: Merge and extend for global context
- Example: If they add agent sharing, adapt it for global sharing

**Scenario 2: LibreChat modifies agent schema**
- Risk: Breaking changes to your modifications
- Action: Update your schema extensions
- Mitigation: Keep modifications minimal and well-documented

**Scenario 3: LibreChat adds similar feature**
- Opportunity: Switch to official implementation
- Action: Migrate your data to their format
- Benefit: Reduce maintenance burden

**Scenario 4: Major architecture changes**
- Risk: Significant refactoring needed
- Action: Evaluate cost/benefit of updating
- Option: Stay on stable version if too complex

#### Conflict Prevention Strategies

1. **Minimal Surface Area**
   ```javascript
   // Instead of modifying existing methods
   async function getAgents(userId) {
     // ... original code
   }
   
   // Add new methods
   async function getGlobalAgents() {
     // Your code
   }
   
   async function getAllAgentsIncludingGlobal(userId) {
     const personal = await getAgents(userId);
     const global = await getGlobalAgents();
     return [...global, ...personal];
   }
   ```

2. **Feature Flags**
   ```javascript
   // In librechat.yaml
   features:
     globalAgents: true
   
   // In code
   if (config.features.globalAgents) {
     agents = await getAllAgentsIncludingGlobal(userId);
   } else {
     agents = await getAgents(userId);
   }
   ```

3. **Database Migrations**
   ```javascript
   // Keep changes additive
   // Don't modify existing fields, only add new ones
   isGlobal: { type: Boolean, default: false }
   // This way, upstream changes to Agent model won't conflict
   ```

#### Update Decision Matrix

| LibreChat Update Type | Your Action | Complexity |
|----------------------|-------------|------------|
| Bug fixes | Always merge | Low |
| New unrelated features | Merge | Low |
| Agent system improvements | Careful merge + test | Medium |
| Agent schema changes | Refactor your code | High |
| Breaking API changes | Evaluate staying on version | High |
| Security updates | Always merge ASAP | Critical |

#### Worst Case: Staying on a Stable Version
```yaml
# If updates become too complex
Strategy:
  - Pin to specific LibreChat version
  - Backport security fixes only
  - Plan major refactor for future
  - Document version freeze reasoning

# docker-compose.yml
services:
  api:
    image: yourusername/librechat-business:v0.7.9-stable
    # Frozen at last known good version
```

### Deployment Considerations
```bash
# Building from fork
docker build -t yourusername/librechat-business:latest .

# Update docker-compose.yml
services:
  api:
    image: yourusername/librechat-business:latest
    # instead of: ghcr.io/danny-avila/librechat:latest
```

## Implementation Complexity: 7/10
- Requires database schema changes
- Needs careful permission management
- UI changes across multiple components
- Real-time synchronization complexity
- But follows existing LibreChat patterns
- Additional complexity from fork management

## Alternative Approaches Considered
1. **Shared Agents Table**: Separate collection - too complex
2. **Agent Templates**: Copy to each user - loses sync capability
3. **Preset Enhancement**: Add tool support - requires deeper changes
4. **Config-only Agents**: Define in YAML - lacks UI management
5. **Plugin System**: Would be ideal but LibreChat doesn't support agent plugins

This implementation provides the best balance of functionality and maintainability while allowing future business-specific enhancements.