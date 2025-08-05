name: "Academy Admin Features - Module Management & Forum Moderation"
description: |

## Purpose
Implement comprehensive admin features for the Academy system, including module content management and forum moderation capabilities, aligned with the new simplified module-based structure.

## Core Principles
1. **Simplified Structure**: Modules are standalone units (no course hierarchy)
2. **Role-Based Access**: Clear separation between user and admin capabilities
3. **Audit Trail**: Soft deletes for accountability
4. **Real-time Updates**: Changes reflect immediately in the UI
5. **Security First**: Input validation, sanitization, and authorization checks

---

## Goal
Build a complete admin system that allows:
- Administrators to manage Academy modules (CRUD operations)
- Users to edit/delete their own forum posts and replies
- Administrators to moderate all forum content
- Seamless content management without technical knowledge

## Why
- **Business Value**: Enable non-technical admins to manage Academy content
- **User Empowerment**: Allow users to manage their own contributions
- **Content Quality**: Maintain high-quality educational content through easy updates
- **Community Health**: Effective moderation tools for forum management

## What
### User-Visible Features
1. **Module Management (Admin)**
   - Create new modules with all content fields
   - Edit existing module content inline
   - Delete modules with confirmation
   - Reorder modules via drag-and-drop
   - Upload/change module thumbnails

2. **Forum Moderation**
   - Users can edit/delete their own posts and replies
   - Admins can edit/delete any forum content
   - Soft delete with restore capability
   - Edit history tracking

### Success Criteria
- [ ] Admin can create, edit, delete modules without code changes
- [ ] Module changes reflect immediately in the Academy
- [ ] Users can manage their own forum content
- [ ] Admins have full moderation capabilities
- [ ] All destructive actions require confirmation
- [ ] Audit trail exists for all modifications
- [ ] File uploads work for module thumbnails
- [ ] Rich text editing works for content fields

## All Needed Context

### Documentation & References
```yaml
- file: /Users/danielschwartz/jk-ai/toolchat/CLAUDE.md
  why: Project conventions and guidelines

- file: /Users/danielschwartz/jk-ai/toolchat/client/src/data-provider/Academy/mockModules.ts
  why: Current module structure and fields to maintain

- file: /Users/danielschwartz/jk-ai/toolchat/packages/data-schemas/src/schema/lms/module.ts
  why: Existing module schema that needs updating

- file: /Users/danielschwartz/jk-ai/toolchat/api/server/middleware/requireJwtAuth.js
  why: Authentication middleware pattern to follow

- file: /Users/danielschwartz/jk-ai/toolchat/api/server/middleware/roles/admin.js
  why: Admin authorization pattern if exists
```

### Current Module Structure (from mockModules.ts)
```typescript
interface Module {
  _id: string;
  title: string;
  description?: string;
  thumbnail?: string;        // Path to image
  videoUrl?: string;         // YouTube/Vimeo embed URL
  textContent?: {
    header: string;
    subtext: string;
  };
  resources?: Array<{
    title: string;
    url: string;
  }>;
  transcript?: string;
  duration?: number;
  order: number;
  isPublished?: boolean;
}
```

### Required Backend Structure
```
/api/server/
  /controllers/lms/
    ModuleController.js      # NEW: Standalone module CRUD
    ForumController.js       # UPDATE: Add edit capabilities
  /routes/lms/
    modules.js              # NEW: Module routes
    forum.js                # UPDATE: Add edit/delete routes
  /services/LMS/
    ModuleService.js        # NEW: Module business logic
    ForumService.js         # UPDATE: Add moderation logic
  /middleware/
    /roles/
      admin.js              # Ensure exists for admin checks
      owner.js              # NEW: Check content ownership
```

### Known Gotchas
```javascript
// CRITICAL: LibreChat uses MongoDB with Mongoose
// CRITICAL: Authentication uses JWT tokens with user._id and role
// CRITICAL: File uploads go to /images/ directory by default
// PATTERN: Controllers return res.status(xxx).json({ ... })
// PATTERN: Use try/catch with error middleware
// GOTCHA: Soft deletes need deletedAt field and query filters
```

## Implementation Blueprint

### Data Models Updates

#### 1. Update Module Schema
```javascript
// packages/data-schemas/src/schema/lms/module.ts
const moduleSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  thumbnail: String,           // Path to uploaded image
  videoUrl: String,            // Embed URL
  textContent: {
    header: String,
    subtext: String
  },
  resources: [{
    title: String,
    url: String
  }],
  transcript: String,
  duration: Number,
  order: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  deletedAt: Date              // Soft delete
}, {
  timestamps: true
});

// Add soft delete filter
moduleSchema.pre(['find', 'findOne'], function() {
  this.where({ deletedAt: null });
});
```

#### 2. Update Forum Schemas for Soft Delete
```javascript
// Add to both forumPost and forumReply schemas:
{
  editHistory: [{
    content: String,
    editedAt: Date,
    editedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  }],
  deletedAt: Date,
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}
```

### Task List

```yaml
Task 1: Create Admin Authorization Middleware
MODIFY api/server/middleware/roles/admin.js:
  - CHECK user.role === 'admin' or similar field
  - RETURN 403 if not admin
  - PATTERN: Follow requireJwtAuth.js structure

Task 2: Create Owner Authorization Middleware  
CREATE api/server/middleware/roles/owner.js:
  - CHECK resource.author === user._id
  - ALLOW if owner OR admin
  - PATTERN: Combine with admin check

Task 3: Update Module Controller for Standalone Operations
CREATE api/server/controllers/lms/ModuleController.js:
  - getModules: List all published (or all for admin)
  - getModule: Single module by ID
  - createModule: Admin only, handle thumbnail upload
  - updateModule: Admin only, validate all fields
  - deleteModule: Soft delete with deletedAt
  - reorderModules: Update order field for multiple modules
  - uploadThumbnail: Handle image upload to /images/modules/

Task 4: Create Module Service Layer
CREATE api/server/services/LMS/ModuleService.js:
  - Business logic for module operations
  - Validation of video URLs (YouTube/Vimeo)
  - Thumbnail processing and storage
  - Order management logic

Task 5: Update Forum Controller for Moderation
MODIFY api/server/controllers/lms/ForumController.js:
  - updatePost: Check ownership, track edit history
  - deletePost: Soft delete, check ownership/admin
  - updateReply: Same pattern as posts
  - deleteReply: Same pattern as posts

Task 6: Create Module Management Routes
CREATE api/server/routes/lms/modules.js:
  - GET    /         - Public: get published, Admin: get all
  - GET    /:id      - Get single module
  - POST   /         - Admin: create module
  - PUT    /:id      - Admin: update module
  - DELETE /:id      - Admin: soft delete
  - POST   /:id/thumbnail - Admin: upload thumbnail
  - PUT    /reorder  - Admin: bulk update order

Task 7: Update Forum Routes
MODIFY api/server/routes/lms/forum.js:
  - PUT    /posts/:id     - Update post (owner/admin)
  - DELETE /posts/:id     - Delete post (owner/admin)
  - PUT    /replies/:id   - Update reply (owner/admin)
  - DELETE /replies/:id   - Delete reply (owner/admin)

Task 8: Create Admin Dashboard Components
CREATE client/src/components/Academy/Admin/ModuleManager.tsx:
  - Table view of all modules
  - Edit/Delete actions per row
  - Add new module button
  - Drag-and-drop reordering

CREATE client/src/components/Academy/Admin/ModuleEditor.tsx:
  - Form for all module fields
  - Rich text editor for textContent
  - Resource link manager
  - Thumbnail upload with preview
  - Save/Cancel actions

Task 9: Add Edit/Delete UI to Forum Components
MODIFY client/src/components/Forum/PostCard.tsx:
  - Show edit/delete buttons for owner/admin
  - Inline edit mode
  - Confirmation dialog for delete

MODIFY client/src/components/Forum/ReplyThread.tsx:
  - Same edit/delete pattern as posts

Task 10: Create Data Provider Mutations
CREATE client/src/data-provider/Academy/adminMutations.ts:
  - useCreateModule
  - useUpdateModule  
  - useDeleteModule
  - useReorderModules
  - useUploadThumbnail
  - useUpdatePost
  - useDeletePost
  - useUpdateReply
  - useDeleteReply
```

### Integration Points
```yaml
DATABASE:
  - Migration: Update module schema to standalone
  - Migration: Add soft delete fields to forum schemas
  - Index: Create index on module.order for sorting
  
AUTHENTICATION:
  - Verify JWT contains user.role field
  - Add isAdmin helper to auth context
  
FILE UPLOAD:
  - Configure multer for thumbnail uploads
  - Create /images/modules/ directory
  - Add file size limits (e.g., 5MB)
  
FRONTEND ROUTING:
  - Add /academy/admin route for management
  - Protect with admin role check
```

## Validation & Testing

### API Endpoint Tests
```bash
# Test module creation (admin)
curl -X POST http://localhost:3080/api/lms/modules \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Module",
    "description": "Test description",
    "videoUrl": "https://youtube.com/embed/xxx",
    "textContent": {
      "header": "Test Header",
      "subtext": "Test content"
    }
  }'

# Test forum post update (owner)
curl -X PUT http://localhost:3080/api/lms/forum/posts/:postId \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Updated content"}'

# Test unauthorized access
curl -X DELETE http://localhost:3080/api/lms/modules/:id \
  -H "Authorization: Bearer $USER_TOKEN"
# Expected: 403 Forbidden
```

### Frontend Component Tests
```javascript
// Test admin can see edit buttons
test('admin sees module edit button', () => {
  const { getByRole } = render(
    <ModuleViewer module={mockModule} />,
    { wrapper: AdminAuthProvider }
  );
  expect(getByRole('button', { name: /edit/i })).toBeInTheDocument();
});

// Test user can edit own post
test('user can edit own forum post', () => {
  const post = { ...mockPost, author: { _id: currentUser._id }};
  const { getByRole } = render(<PostCard post={post} />);
  expect(getByRole('button', { name: /edit/i })).toBeInTheDocument();
});

// Test soft delete
test('deleted content is not visible', async () => {
  const deletedModule = { ...mockModule, deletedAt: new Date() };
  const { queryByText } = render(<ModuleList />);
  expect(queryByText(deletedModule.title)).not.toBeInTheDocument();
});
```

## Security Considerations

### Input Validation
```javascript
// Validate video URLs
const isValidVideoUrl = (url) => {
  const patterns = [
    /^https:\/\/(www\.)?youtube\.com\/embed\/.+/,
    /^https:\/\/player\.vimeo\.com\/video\/.+/
  ];
  return patterns.some(pattern => pattern.test(url));
};

// Sanitize HTML content
const sanitizeContent = (html) => {
  // Use DOMPurify or similar
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target']
  });
};

// File upload validation
const validateThumbnail = (file) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (file.size > maxSize) throw new Error('File too large');
  if (!allowedTypes.includes(file.mimetype)) throw new Error('Invalid file type');
};
```

### Authorization Checks
```javascript
// Every admin endpoint must check
if (!user.isAdmin) {
  return res.status(403).json({ error: 'Admin access required' });
}

// Owner checks for forum content
if (post.author.toString() !== user._id && !user.isAdmin) {
  return res.status(403).json({ error: 'Unauthorized' });
}
```

## Final Validation Checklist
- [ ] Admin can perform all CRUD operations on modules
- [ ] Module thumbnails upload and display correctly
- [ ] Users can edit/delete only their own forum content
- [ ] Admins can moderate all forum content
- [ ] Soft deletes work (content hidden but not destroyed)
- [ ] Edit history is tracked for forum content
- [ ] All inputs are validated and sanitized
- [ ] Authorization checks prevent unauthorized access
- [ ] File uploads are size/type restricted
- [ ] Drag-and-drop reordering updates order field
- [ ] Rich text editor preserves formatting
- [ ] Confirmation dialogs prevent accidental deletions
- [ ] API returns appropriate error messages
- [ ] Loading states shown during operations
- [ ] Success/error toasts provide feedback

---

## Anti-Patterns to Avoid
- ❌ Don't hard delete content - use soft deletes
- ❌ Don't trust client-side authorization checks alone
- ❌ Don't allow unlimited file uploads
- ❌ Don't expose internal IDs in error messages
- ❌ Don't skip ownership verification
- ❌ Don't allow HTML without sanitization
- ❌ Don't modify production data without backups