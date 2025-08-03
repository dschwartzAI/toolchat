# AI Business Tools Platform - Customization Guide

This guide explains how to customize the LibreChat interface and configuration for your business needs.

## Table of Contents

1. [UI Customization](#ui-customization)
2. [Localization & Terminology](#localization--terminology)
3. [Agent Configuration](#agent-configuration)
4. [User Tier System](#user-tier-system)
5. [Branding](#branding)
6. [Advanced Customizations](#advanced-customizations)

## UI Customization

### Configuration via librechat.yaml

The main UI customization happens in `LibreChat/librechat.yaml`:

```yaml
interface:
  endpointsMenu: true      # Show tool selection menu
  modelSelect: false       # Hide model selection dropdown
  parameters: false        # Hide temperature, max tokens, etc.
  presets: true           # Allow saving conversation templates
  agents: true            # Show agents (as "Business Tools")
  sidePanel: true         # Show side panel
  speechToText: true      # Enable voice input
  textToSpeech: false     # Disable TTS for simplicity
```

### Hiding Technical Elements

To maintain a business-friendly interface:

1. **Hide Model Selection**
   ```yaml
   modelSelect: false
   ```

2. **Hide Parameters**
   ```yaml
   parameters: false
   ```

3. **Disable Agent Builder for Non-Admins**
   ```yaml
   endpoints:
     agents:
       disableBuilder: true
   ```

## Localization & Terminology

### Custom Text Overrides

Edit `LibreChat/client/src/localization/custom-en.json` to change any UI text:

```json
{
  "com.ui.agents": "Business Tools",
  "com.ui.endpoint": "Tool Category",
  "com.ui.model": "Tool Type",
  "com.ui.newChat": "Start New Session",
  "com.nav.agents": "Business Tools",
  "com.error.premium": "This tool requires a Premium subscription."
}
```

### Adding New Languages

1. Copy `custom-en.json` to `custom-es.json` (for Spanish)
2. Translate all values
3. Import in the localization system

### Common Terminology Changes

| Technical Term | Business Term |
|----------------|---------------|
| Agents | Business Tools |
| Endpoints | Tool Categories |
| Model | Tool Type |
| Parameters | Settings |
| Conversations | Sessions |
| System Prompt | Business Context |
| Artifacts | Generated Documents |

## Agent Configuration

### Creating Business-Focused Agents

Agents are configured in JSON with these key fields:

```json
{
  "name": "Business Tool Name",
  "description": "What this tool does",
  "model": "gpt-4o",
  "temperature": 0.7,
  "metadata": {
    "requiredTier": "premium",
    "displayName": "Friendly Name",
    "icon": "🎯",
    "shortDescription": "One-line description",
    "capabilities": ["Feature 1", "Feature 2"]
  }
}
```

### System Prompts Best Practices

1. **Business Context First**
   ```
   You are a business advisor helping entrepreneurs...
   ```

2. **Avoid Technical Jargon**
   ```
   // Bad: "I'll use NLP to analyze your query"
   // Good: "I'll help you with that business challenge"
   ```

3. **Action-Oriented**
   ```
   Always end with a clear next step or question
   ```

### Tool Integration

When agents mention other tools:
```markdown
"Speaking of pricing strategy, we have a specialized 
Hybrid Offer Creator tool that can help. But first..."
```

## User Tier System

### Extending User Model

The user model (`config/User.js`) adds:

```javascript
{
  tier: 'free|premium|admin',
  businessMetadata: {
    company: String,
    industry: String,
    lastToolUsed: String
  },
  usageLimits: {
    dailyMessages: Number,
    dailyFileUploads: Number
  }
}
```

### Tier-Based Access Control

Configure in `config/tierAccess.js`:

```javascript
const TIER_ACCESS = {
  free: ['ContentEndpoint'],
  premium: ['CoachingEndpoint', 'ContentEndpoint'],
  admin: ['*']
};
```

### Customizing Tier Limits

Edit environment variables:
```env
# In .env
FREE_USER_TOOLS=ContentEndpoint
PREMIUM_USER_TOOLS=CoachingEndpoint,ContentEndpoint
FREE_DAILY_MESSAGES=50
PREMIUM_DAILY_MESSAGES=1000
```

## Branding

### Logo and Colors

1. **Replace Logo**
   ```bash
   cp your-logo.png LibreChat/client/public/logo.png
   ```

2. **Update Colors**
   Edit `LibreChat/client/src/styles/theme.css`:
   ```css
   :root {
     --primary-color: #your-brand-color;
     --secondary-color: #your-secondary-color;
   }
   ```

### App Title

Set in `.env`:
```env
APP_TITLE=AI Business Tools Platform
```

### Welcome Message

Configure in `librechat.yaml`:
```yaml
welcomeMessage:
  enabled: true
  message: |
    Welcome to your AI Business Tools Platform! 🚀
    
    Select a tool to get started.
```

## Advanced Customizations

### Custom Navigation Component

The example `config/CustomNav.jsx` shows how to:

1. Filter menu items by user tier
2. Add upgrade prompts for free users
3. Use business-friendly icons
4. Simplify navigation structure

### Adding New Business Tools

1. **Create Agent Configuration**
   ```bash
   config/agents/new-tool-config.json
   ```

2. **Create System Prompts**
   ```bash
   config/prompts/new-tool-system.md
   ```

3. **Update Agent Setup Script**
   ```javascript
   // In configure-agents.js
   await configureNewTool();
   ```

4. **Set Tier Requirements**
   ```json
   "metadata": {
     "requiredTier": "premium"
   }
   ```

### Custom Endpoints

Add specialized endpoints in `librechat.yaml`:

```yaml
custom:
  - name: "SpecializedTool"
    apiKey: "${API_KEY}"
    baseURL: "https://api.example.com"
    models:
      default: ["model-name"]
    modelDisplayLabel: "Business Tool Name"
```

### Middleware Customization

Add business logic in `tierAccess.js`:

```javascript
// Track tool usage
user.businessMetadata.toolUsageCount.set(
  toolName, 
  (count || 0) + 1
);

// Apply business rules
if (user.company.type === 'startup') {
  limits.dailyMessages *= 1.5; // 50% bonus
}
```

### Database Extensions

Add business-specific fields:

```javascript
// In User model
subscription: {
  plan: String,
  features: [String],
  customLimits: Object
}

// Track business metrics
businessMetrics: {
  revenue: Number,
  teamSize: Number,
  primaryUseCase: String
}
```

## Testing Customizations

### Verify UI Changes

```bash
# Check localization
grep -r "Business Tools" LibreChat/client/dist/

# Test tier access
node tests/test-access.js

# Verify agent visibility
node tests/test-agents.js
```

### Common Issues

1. **Customization Not Showing**
   - Rebuild client: `docker-compose exec api npm run frontend:build`
   - Clear browser cache
   - Restart services

2. **Tier Access Not Working**
   - Check user tier in database
   - Verify middleware is loaded
   - Test with different user accounts

3. **Agent Not Appearing**
   - Run `node scripts/configure-agents.js`
   - Check agent's requiredTier setting
   - Verify user has appropriate tier

## Best Practices

### Do's ✅
- Keep business context front and center
- Use consistent terminology throughout
- Test with real business users
- Document all customizations
- Maintain upgrade path for LibreChat

### Don'ts ❌
- Don't modify core LibreChat files directly
- Don't hardcode business logic
- Don't expose technical complexity
- Don't skip testing tier restrictions
- Don't forget about mobile users

## Future Customization Ideas

1. **Industry-Specific Tools**
   - Real Estate Offer Creator
   - SaaS Pricing Calculator
   - Course Outline Generator

2. **Integration Points**
   - CRM connections
   - Email automation
   - Calendar scheduling

3. **Advanced Features**
   - Team collaboration
   - Workflow automation
   - Analytics dashboards

Remember: The goal is to make AI accessible to business users without technical complexity!