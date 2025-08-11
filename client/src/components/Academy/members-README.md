# Members Directory Feature

## Overview
The Members tab displays a searchable directory of all platform users in the Academy area.

## Data Source
Currently fetches **real users** from MongoDB via `/api/academy/members` endpoint.

### API Response Format
```typescript
{
  members: Array<{
    id: string;        // User._id
    name: string;      // User.name
    username?: string; // User.username
    avatarUrl: string; // User.avatar
    bio?: string;      // Combines User.role + User.company
    location?: string; // User.location
  }>
}
```

## Current Implementation (MVP)

### Backend
- **Route**: `/api/academy/members` (GET, auth required)
- **File**: `api/server/routes/lms/members.js`
- Returns up to 500 users with safe fields only
- No pagination (single fetch)
- No server-side search

### Frontend Components
1. **MembersTab**: Main container with search
2. **MemberCard**: Individual user card
3. **ChatModal**: UI-only chat preview (not functional)

### Features
- Client-side search with 300ms debounce
- Filters across: name, username, bio, location
- Responsive grid (1-3 columns)
- Chat button opens modal (UI only)

## Future Enhancements

### Phase 2
- [ ] Pagination or infinite scroll for large user bases
- [ ] Server-side search for performance
- [ ] Real-time online status
- [ ] "Active Xm ago" based on actual lastLogin

### Phase 3
- [ ] Functional DM/chat integration
- [ ] User profiles with more details
- [ ] Follow/connect functionality
- [ ] Activity feed

## Security Notes
- Email addresses are never exposed
- Passwords and sensitive fields excluded
- Auth required for all member endpoints
- Strict field projection in queries

## Customization Points

### To Add More User Fields
1. Add field to User model (`api/models/User.js`)
2. Include in projection (`api/server/routes/lms/members.js`)
3. Update Member type (`client/src/data-provider/Academy/membersQueries.ts`)
4. Display in MemberCard component

### To Connect Real Chat
1. Implement chat/messaging system
2. Update ChatModal to use real messaging API
3. Add WebSocket for real-time messages
4. Store conversation history

## Testing
```bash
# Test API endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3080/api/academy/members

# Check user count
mongo librechat --eval "db.users.count({isDeleted: {$ne: true}})"
```