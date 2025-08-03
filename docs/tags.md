# Tags Feature Implementation

## Overview
Replace the current bookmarks functionality with a simplified tagging system that allows users to quickly tag conversations for better organization.

## Current State
- Feature is called "Bookmarks" with a complex UI
- Modal has two fields: "Title" and a text area for bookmark details
- Has a checkbox "Add to current conversation"
- Accessed via bookmark icon in chat header

## Desired State
- Feature renamed to "Tags"
- Simplified modal with single "Add tag" input field
- No checkbox - automatically adds to current conversation
- Quick, intuitive tagging workflow

## UI/UX Changes

### 1. Rename Throughout Application
- Change all instances of "Bookmark" to "Tag"
- Update icon tooltip from "Bookmark" to "Tag conversation"
- Update sidebar section from "Bookmarks" to "Tags"

### 2. Simplified Tag Modal
```
Current Modal:
┌─────────────────────────────┐
│ Bookmark                    │
├─────────────────────────────┤
│ Title                       │
│ [___________________]       │
│                             │
│ [Large text area]           │
│                             │
│ View and delete your        │
│ bookmarks                   │
│                             │
│ ☑ Add to current           │
│   conversation              │
│                             │
│ [Cancel]  [Save]           │
└─────────────────────────────┘

New Modal:
┌─────────────────────────────┐
│ Add Tag                     │
├─────────────────────────────┤
│ Tag name                    │
│ [___________________]       │
│                             │
│ [Cancel]  [Add Tag]        │
└─────────────────────────────┘
```

### 3. Tag Display
- Show tags as chips/badges in conversation list
- Allow multiple tags per conversation
- Click tag to filter conversations

## Technical Implementation

### Database Changes
1. Rename `bookmarks` table to `tags` (or create new table)
2. Simplify schema:
   ```sql
   tags:
   - id
   - conversation_id
   - tag_name
   - created_at
   - user_id
   ```
3. Remove unnecessary fields like description/content

### API Changes
1. Update endpoints:
   - `POST /api/bookmarks` → `POST /api/tags`
   - `GET /api/bookmarks` → `GET /api/tags`
   - `DELETE /api/bookmarks/:id` → `DELETE /api/tags/:id`

2. Simplify request/response:
   ```javascript
   // Add tag
   POST /api/tags
   {
     "conversation_id": "xxx",
     "tag_name": "important"
   }
   
   // Get tags for conversation
   GET /api/tags?conversation_id=xxx
   ```

### Frontend Changes

1. **Modal Component** (`TagModal.jsx`):
   - Single input field for tag name
   - Auto-focus on input when modal opens
   - Enter key submits
   - No checkbox needed
   - Cleaner, minimal design

2. **Conversation List**:
   - Display tags as small badges/chips
   - Support multiple tags per conversation
   - Visual indicator when conversation has tags

3. **Tag Management**:
   - Click tag to filter conversations
   - Manage tags in sidebar
   - Quick remove tag option (X on chip)

### Component Structure
```
components/
  Chat/
    TagModal.jsx         (new simplified modal)
    TagChip.jsx         (display individual tag)
    TagList.jsx         (display tags on conversation)
  Sidebar/
    TagsSection.jsx     (manage all tags)
    TagFilter.jsx       (filter by tag)
```

## User Flow

1. **Adding a Tag**:
   - User clicks tag icon in chat header
   - Modal appears with single input field
   - User types tag name and hits Enter or clicks "Add Tag"
   - Tag immediately appears on conversation
   - Modal closes

2. **Viewing Tags**:
   - Tags visible as chips in conversation list
   - Tags section in sidebar shows all unique tags
   - Click any tag to filter conversations

3. **Removing Tags**:
   - Click X on tag chip to remove from conversation
   - Manage all tags from sidebar section

## Benefits
- Faster workflow (single field vs multiple)
- Clearer purpose (tags vs bookmarks)
- Better organization with multiple tags
- Intuitive filtering by tag
- Less cognitive load for users

## Migration Strategy
1. Create new tags table/schema
2. Migrate existing bookmarks (use title as tag name)
3. Update all UI components
4. Update API endpoints
5. Test thoroughly
6. Deploy with migration script

## Success Metrics
- Reduced time to tag a conversation
- Increased usage of tagging feature
- Better conversation organization
- Positive user feedback on simplicity

## Additional Considerations
- Tag autocomplete for consistency
- Tag colors for visual organization
- Bulk tagging operations
- Tag analytics (most used tags)
- Export conversations by tag