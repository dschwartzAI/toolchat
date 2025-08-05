# LibreChat Agent Icons & User Avatar Implementation Report

## Overview
This report details how agent icons and user avatars are displayed in LibreChat, providing a comprehensive guide for replicating this functionality in a forked version.

## 1. Agent Icon System Architecture

### 1.1 Data Structure
Agent icons are stored as part of the agent's avatar property:
```typescript
// Agent type definition (packages/data-provider/src/types/assistants.ts:209)
type Agent = {
  id: string;
  name: string | null;
  avatar: AgentAvatar | null;
  // ... other properties
}

type AgentAvatar = {
  filepath: string;  // e.g., "/images/6869b4e65de8d8eed9f0fa69/agent-agent_KVXW88WVte1tcyABlAowy-avatar-1752277221712.png"
  source: string;    // e.g., "manual" or "generated"
}
```

### 1.2 Icon Sources and Configuration

#### Method 1: Agent Builder Upload (Primary Method)
- Agents created through the UI can have avatars uploaded via the agent builder
- Uploaded images are stored in `/client/public/images/{userId}/agent-{agentId}-avatar-{timestamp}.png`
- The upload endpoint is `/api/images/agents/:agent_id/avatar`

#### Method 2: librechat.yaml Configuration
In `librechat.yaml`, each agent in the modelSpecs has icon configuration:
```yaml
modelSpecs:
  list:
    - name: "DarkJK"
      iconURL: "/images/darkjk.jpg"        # Icon shown in model selector
      specIconURL: "/images/darkjk.jpg"    # Also used for display
      preset:
        agent_id: "agent_KVXW88WVte1tcyABlAowy"
```

### 1.3 Static Icon Files
Icons referenced in librechat.yaml are stored in `/client/public/images/`:
- `darkjk.jpg`
- `dcm-icon-green.png`
- `hybrid-icon-blue.png`
- `icp-icon.png`
- `sovereign-jk.jpeg`
- `workshop-copy-paster.png`

## 2. Icon Display Implementation

### 2.1 Sidebar Conversations
Location: `/client/src/components/Conversations/Convo.tsx:185-192`
```jsx
<EndpointIcon
  conversation={conversation}
  endpointsConfig={endpointsConfig}
  size={20}
  context="menu-item"
  agentMap={agentMap}
  assistantMap={assistantMap}
/>
```

### 2.2 Welcome/Landing Screen
Location: `/client/src/components/Chat/Landing.tsx:156-165`
```jsx
<ConvoIcon
  agentsMap={agentsMap}
  assistantMap={assistantMap}
  conversation={conversation}
  endpointsConfig={endpointsConfig}
  containerClassName={containerClassName}
  context="landing"
  className="h-2/3 w-2/3 text-black dark:text-white"
  size={41}
/>
```

### 2.3 Icon Resolution Logic
The system follows this priority order in `EndpointIcon.tsx`:
1. **Agent Avatar** (from agent builder): `agent?.avatar?.filepath`
2. **Assistant Avatar**: `assistant?.metadata?.avatar`
3. **Conversation iconURL**: `conversation?.iconURL`
4. **Endpoint iconURL**: From endpointsConfig
5. **Fallback**: MinimalIcon component

## 3. User Avatar System

### 3.1 User Avatar Storage
- Upload endpoint: `/api/images/avatar`
- Stored location: `/client/public/images/{userId}/avatar-{timestamp}.png`
- User object includes avatar URL: `user.avatar`

### 3.2 Avatar Display Logic
Location: `/client/src/components/Nav/AccountSettings.tsx:56-60`
```jsx
<img
  className="rounded-full"
  src={(user?.avatar ?? '') || avatarSrc}
  alt={`${user?.name || user?.username || user?.email || ''}'s avatar`}
/>
```

### 3.3 Fallback Avatar Generation
Uses `useAvatar` hook (`/client/src/hooks/Messages/useAvatar.ts`):
- If no avatar URL exists, generates one using @dicebear/core
- Creates initials-based avatar from username or name
- Caches generated avatars for performance

## 4. Critical Implementation Details

### 4.1 Image Serving
- Static route: `/images/` → `/client/public/images/`
- Configured in `/api/server/index.js:109`:
  ```javascript
  app.use('/images/', validateImageRequest, routes.staticRoute);
  ```

### 4.2 Agent Map Loading
- Agents are loaded via `useAgentsMap` hook
- Maps agent IDs to full agent objects including avatar data
- Must be passed through component hierarchy to icon components

### 4.3 Icon URL Formats
- Absolute paths: `/images/filename.png`
- User-uploaded avatars: `/images/{userId}/agent-{agentId}-avatar-{timestamp}.png`
- HTTP URLs: Full URLs starting with `http://` or `https://`

## 5. Replication Checklist

### Backend Requirements:
- [ ] Image upload endpoints for agents and users
- [ ] Static file serving from `/images/` route
- [ ] Agent data structure includes avatar property
- [ ] File storage strategy (local filesystem or cloud)

### Frontend Requirements:
- [ ] ConvoIcon component for displaying agent icons
- [ ] EndpointIcon component for sidebar conversations
- [ ] useAvatar hook for fallback avatar generation
- [ ] Agent map context provider and hooks
- [ ] Icon resolution logic respecting priority order

### Configuration:
- [ ] librechat.yaml with iconURL and specIconURL properties
- [ ] Static icon files in public/images directory
- [ ] Proper CORS and security headers for image serving

## 6. Common Issues and Solutions

### Icons Not Displaying:
1. **Check agent map loading**: Ensure useAgentsMap is called and data is loaded
2. **Verify file paths**: Icons must be in `/client/public/images/`
3. **Check URL format**: Must start with `/images/` or be full HTTP URL
4. **Validate agent IDs**: Ensure conversation has correct agent_id

### User Avatar Issues:
1. **Check user object**: Ensure user.avatar property exists
2. **Verify upload endpoint**: `/api/images/avatar` must be accessible
3. **Check file permissions**: Uploaded files must be readable by web server

## 7. Key Files Reference

### Components:
- `/client/src/components/Endpoints/ConvoIcon.tsx` - Main icon display
- `/client/src/components/Endpoints/EndpointIcon.tsx` - Sidebar icon wrapper
- `/client/src/components/Endpoints/ConvoIconURL.tsx` - URL-based icon display
- `/client/src/components/Nav/AccountSettings.tsx` - User avatar display

### Hooks:
- `/client/src/hooks/Messages/useAvatar.ts` - Avatar generation
- `/client/src/hooks/useAgentsMap.ts` - Agent data loading

### Backend:
- `/api/server/routes/agents/v1.js` - Agent avatar upload
- `/api/server/routes/files/avatar.js` - User avatar upload
- `/api/server/routes/static.js` - Static image serving

### Configuration:
- `/librechat.yaml` - Agent icon configuration
- `/api/config/paths.js` - Image directory paths