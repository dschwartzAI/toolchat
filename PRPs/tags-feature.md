# Tags Feature Implementation PRP (Simplified)

## Feature Overview
Replace the current bookmarks functionality with a simplified tagging system that allows users to quickly tag conversations for better organization. The backend already uses "tags" terminology internally, so this is primarily a UI/UX simplification.

## Current State Analysis

### Backend Infrastructure
The backend is already implemented as a tagging system with the following structure:

**Database Model** (`/LibreChat/packages/data-schemas/src/schema/conversationTag.ts`):
```javascript
{
  tag: String (indexed),           // The tag name
  user: String (indexed),          // User ID
  description: String (indexed),   // Optional description
  count: Number (default: 0),      // Usage count
  position: Number (default: 0),   // Display order
  timestamps: true                 // createdAt, updatedAt
}
```

**API Endpoints** (`/LibreChat/api/server/routes/tags.js`):
- `GET /api/tags` - Get all tags for user
- `POST /api/tags` - Create new tag
- `PUT /api/tags/:tag` - Update existing tag
- `DELETE /api/tags/:tag` - Delete tag
- `PUT /api/tags/convo/:conversationId` - Update tags for conversation

**Conversation Model** stores tags as array of strings in `tags` field.

### Frontend Components
Current implementation in `/LibreChat/client/src/components/`:
- `Bookmarks/BookmarkEditDialog.tsx` - Modal with form
- `Bookmarks/BookmarkForm.tsx` - Form with title, description, checkbox
- `Chat/Menus/BookmarkMenu.tsx` - Dropdown menu in chat header
- `Providers/BookmarkContext.tsx` - State management
- **Existing tag filter in sidebar** - Already allows filtering conversations by tags

## Implementation Blueprint

### Phase 1: UI Text Updates
Update all "Bookmark" references to "Tag" throughout the application.

**Pseudocode**:
```
1. Update localization files (all language files)
2. Update component names and imports
3. Update UI text in components
4. Update tooltips and aria-labels
```

### Phase 2: Simplify Tag Modal

Transform the complex bookmark form into a simple tag input:

**Current Modal Structure**:
```jsx
// BookmarkForm.tsx current implementation
<form>
  <Input label="Title" {...register('tag')} />
  <TextareaAutosize label="Description" {...register('description')} />
  <Checkbox label="Add to current conversation" />
</form>
```

**New Modal Structure**:
```jsx
// TagForm.tsx new implementation
<form onSubmit={handleSubmit}>
  <Input 
    label="Add tag"
    placeholder="Enter tag name..."
    autoFocus
    {...register('tag')}
    onKeyDown={(e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    }}
  />
</form>
```

### Phase 3: Remove Unnecessary UI Elements

**Remove from modal**:
- Description field (keep in backend for compatibility)
- "Add to current conversation" checkbox (always add to current conversation)

**Keep existing**:
- Tag filter in sidebar (already works well)
- Tag management in sidebar
- Existing tag functionality

## File Change List

### Rename Files
```bash
# Components
Bookmarks/ → Tags/
BookmarkEditDialog.tsx → TagDialog.tsx
BookmarkForm.tsx → TagForm.tsx
BookmarkMenu.tsx → TagMenu.tsx
BookmarkContext.tsx → TagContext.tsx
```

### Update Files
1. **Localization** (`/client/src/locales/*/translation.json`):
   - Replace all `com_ui_bookmarks_*` keys with `com_ui_tags_*`
   - Update text values from "Bookmark" to "Tag"

2. **Components**:
   - Simplify form to single input
   - Remove description textarea
   - Remove checkbox (default to always adding to current conversation)
   - Add Enter key submission

## Implementation Tasks

1. **Update all localization files** (17 files)
   - Find/replace bookmark → tag in all translation files
   - Update button text from "Bookmark" to "Tag"
   - Update modal title to "Add Tag"

2. **Simplify tag dialog**
   - Remove description field from UI (keep backend field)
   - Remove "add to conversation" checkbox
   - Always add to current conversation by default
   - Add Enter key submission
   - Auto-focus on input when modal opens

3. **Update tag menu icon/text**
   - Change bookmark icon to tag icon (if different)
   - Update tooltip from "Bookmark" to "Tag conversation"

4. **Clean up form logic**
   - Remove description validation
   - Remove checkbox state management
   - Simplify submit handler

5. **Test and validate**
   - Ensure backward compatibility
   - Test tag creation with Enter key
   - Verify existing tag filter in sidebar still works
   - Check that tags are properly added to conversations

## Validation Gates

```bash
# Frontend build and type checking
cd LibreChat/client
npm run build
npm run type-check

# Run frontend tests
npm test

# Start development server and manual testing
cd ../
docker-compose up -d

# Test checklist:
# - Can create new tags via simplified modal
# - Enter key submits tag form
# - Auto-focuses on input when modal opens
# - Tags appear in sidebar filter (existing functionality)
# - All text shows "Tags" not "Bookmarks"
# - No description field visible
# - No checkbox visible
```

## Error Handling Strategy

1. **Duplicate Tags**: Show toast notification "Tag already exists"
2. **Empty Tag Names**: Disable submit button, show validation error
3. **API Failures**: Show error toast, keep modal open

## References and Resources

### Existing Patterns in Codebase
- Modal patterns: `/client/src/components/ui/OGDialogTemplate.tsx`
- Form handling: Uses react-hook-form throughout
- Toast notifications: `/client/src/Providers/ToastContext.tsx`

### Key Implementation Notes
1. Backend already uses "tags" - no database changes needed
2. Keep `description` field in database for backward compatibility
3. Use existing mutation hooks - they're already properly named
4. Existing sidebar tag filter remains unchanged
5. No new UI components needed - just simplification

## Migration Considerations

1. Existing bookmarks will become tags automatically
2. Description field data preserved but hidden in UI
3. All API endpoints remain the same
4. No data loss during transition
5. Existing tag filtering continues to work

## Success Metrics

- Reduced time to tag conversation (target: < 3 seconds)
- Increased usage of tagging feature due to simplicity
- No regression in existing functionality
- Cleaner, less confusing UI

## Confidence Score: 10/10

Maximum confidence due to:
- Only removing UI elements, not adding
- Backend already implemented correctly
- Existing tag filter works and remains unchanged
- Clear requirements for simplification
- No complex new features to implement

This is purely a UI simplification task with minimal risk.