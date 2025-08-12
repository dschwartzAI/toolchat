# GoHighLevel MCP: Per‑User Dynamic Integration

## Goal
Enable every user to connect their own GoHighLevel (HighLevel) private integration API key and location ID, so all MCP tool calls execute against that user’s HighLevel account instead of a single global account.

## Current State (assumed)
- `librechat.yaml` declares an MCP server `gohighlevel` with static env vars `GHL_API_KEY` and `GHL_LOCATION_ID`.
- `packages/gohighlevel-mcp-direct.js` (or similar) reads credentials from `process.env`.
- Tools run under a single global account.

## Design Overview
- Keep a single MCP server process.
- Make credentials user‑scoped and provided at runtime on a per‑connection basis.
- Do not expose credentials to the model; set them programmatically from the server when a user session initializes.
- Provide encrypted storage and a small settings UI so users can add/rotate their own keys.

## Changes by Layer

### 1) YAML (Configuration)
- Keep the server entry, but remove hardcoded per‑user credentials from `env`.
- Optionally keep global `GHL_API_KEY`/`GHL_LOCATION_ID` as a fallback for users who haven’t connected their account yet.

Example:
```yaml
mcpServers:
  gohighlevel:
    type: stdio
    command: node
    args:
      - "./packages/gohighlevel-mcp-direct.js"
    # env:            # optional fallback only
    #   GHL_API_KEY: "${GHL_FALLBACK_API_KEY}"
    #   GHL_LOCATION_ID: "${GHL_FALLBACK_LOCATION_ID}"
    timeout: 30000
    startup: true
    chatMenu: true
    description: "GoHighLevel CRM - per-user integration via dynamic credentials"
```

### 2) MCP Server (packages/gohighlevel-mcp-direct.js)
- Add per‑connection credential cache: `Map<connectionId, { apiKey: string; locationId: string }>`.
- Add a tool `gohighlevel.setCredentials({ apiKey, locationId })`:
  - Validates values with a lightweight ping (e.g., GET current user or list locations).
  - Saves into the map for the current connection.
- For every existing tool (contacts, calendars, opportunities, conversations, etc.):
  - Resolve credentials by precedence:
    1. `args.apiKey`/`args.locationId` (rare, usually omitted)
    2. cached creds for this connection
    3. `process.env.GHL_API_KEY`/`GHL_LOCATION_ID` fallback
  - If none present → return a user‑actionable error: "GoHighLevel is not connected. Please connect your API key in Settings."
- Never log secrets. Mask them in debug logs.

Pseudocode:
```ts
const credsByConn = new Map<string, { apiKey: string; locationId: string }>();

function getCreds(ctx, args) {
  const fromArgs = args?.apiKey && args?.locationId ? { apiKey: args.apiKey, locationId: args.locationId } : null;
  const fromConn = credsByConn.get(ctx.connectionId) ?? null;
  const fromEnv = process.env.GHL_API_KEY && process.env.GHL_LOCATION_ID
    ? { apiKey: process.env.GHL_API_KEY, locationId: process.env.GHL_LOCATION_ID }
    : null;
  return fromArgs || fromConn || fromEnv;
}

registerTool('gohighlevel.setCredentials', async (ctx, { apiKey, locationId }) => {
  // validate (e.g., GET /users/me)
  await pingHighLevel({ apiKey, locationId });
  credsByConn.set(ctx.connectionId, { apiKey, locationId });
  return { ok: true };
});

registerTool('gohighlevel.contacts_get-contacts', async (ctx, args) => {
  const creds = getCreds(ctx, args);
  if (!creds) throw new Error('GoHighLevel not connected');
  return await ghl.contacts.list(creds, args.query);
});
```

### 3) Backend (Server) – Credential Storage and Session Initialization
- Add routes:
  - `POST/PUT /api/integrations/gohighlevel` → saves `{ apiKey, locationId }` for the authenticated user.
  - `GET /api/integrations/gohighlevel` → returns masked creds (for UI display).
- Storage:
  - Encrypt `apiKey` at rest (AES‑GCM) using a server‑side key from env (e.g., `APP_ENCRYPTION_KEY`).
  - Hash userId scoping to avoid cross‑tenant leakage.
- Initialization:
  - When creating a chat client (Agents or Assistants), after MCP connection is established for that user/session, programmatically call the MCP tool `gohighlevel.setCredentials` with the decrypted creds. Do this server‑side so the LLM never sees the key.
  - Re‑call on reconnection or when creds are updated.

Flow:
1. User saves creds in Settings → backend encrypts and stores.
2. Chat starts → server opens MCP connection.
3. Server invokes `gohighlevel.setCredentials({ apiKey, locationId })` on that MCP connection.
4. Model asks to use GHL tools → tools transparently use per‑connection creds.

### 4) Frontend (Settings UI)
- Add a simple form: API Key (password field) + Location ID (text/select).
- Validate by calling backend `POST /api/integrations/gohighlevel` (backend optionally verifies with a ping before saving).
- Show masked state (e.g., `sk_************abcd`) and a "Test Connection" button.
- No creds are sent to the LLM; all routing is server→MCP.

### 5) Security
- Never log raw API keys.
- Encrypt at rest using `APP_ENCRYPTION_KEY`.
- Limit MCP process logs to masked values.
- Scope credentials by MCP connection; clear on disconnect.
- Optional: rate‑limit setCredentials to defend misuse.

### 6) Error Handling & UX
- If tools are invoked without creds:
  - Return a friendly error: "Connect your HighLevel account in Settings → Integrations." (and include a deep link if possible).
- If validation fails during setCredentials:
  - Return error with hint: "Invalid API key or location."
- If HighLevel returns 401/403 mid‑session:
  - Clear connection cache and prompt re‑connect.

### 7) Backward Compatibility (Fallback)
- Keep optional global env creds for testing/admin.
- Precedence guarantees users with their own keys always override global.

### 8) Testing Plan
- Unit: credential precedence, masking, encryption/decryption cycle.
- Integration: set creds → call contacts list; rotate creds; revoke creds.
- Failure: missing creds → helpful error; invalid creds → validation error; expired creds mid‑stream → recovery path.

### 9) Minimal Edits Checklist
- YAML: remove per‑user creds; keep fallback optional.
- MCP server: add `setCredentials`, per‑connection store, precedence resolver.
- Backend: endpoints for save/get; on connect, call `setCredentials` with user creds.
- Frontend: small settings form to save/test creds.

### 10) Migration & Rollout
- Deploy MCP and backend changes first (fallback enabled).
- Release Settings UI; prompt users to connect HighLevel.
- Monitor logs for unauthenticated calls; guide users via banner until most have connected.

## API Contracts

- POST `/api/integrations/gohighlevel`
  - body: `{ apiKey: string, locationId: string }`
  - returns: `{ ok: true }`

- GET `/api/integrations/gohighlevel`
  - returns: `{ connected: boolean, locationId?: string, apiKeyMasked?: string }`

- MCP tool `gohighlevel.setCredentials`
  - args: `{ apiKey: string, locationId: string }`
  - returns: `{ ok: true }`

## Notes
- This design is provider‑agnostic; the same pattern can be reused for other MCPs that require per‑user credentials.
