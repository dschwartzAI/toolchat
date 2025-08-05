name: "LMS & Community Forum Implementation for LibreChat"
description: |

## Purpose
Implementation of a native Learning Management System (LMS) and Community Forum within LibreChat, replacing external Skool.com dependency. This feature provides course delivery, progress tracking, and community discussions integrated seamlessly into the existing LibreChat interface.

## Core Principles
1. **Seamless Integration**: LMS features blend naturally with existing LibreChat UI/UX
2. **MongoDB-First**: Leverage existing MongoDB patterns and infrastructure
3. **Admin Control**: Simple content management for course creators
4. **Progress Tracking**: Automatic video watch time and lesson completion
5. **Community Engagement**: Real-time forum discussions with moderation
6. **Global rules**: Follow all rules in CLAUDE.md

---

## Goal
Build a native LMS platform within LibreChat that:
- Provides course delivery with video lessons, modules, and progress tracking
- Includes a community forum with category-based discussions
- Maintains the simplified LibreChat user experience
- Uses existing authentication and user management
- Supports admin-only content management
- Tracks user progress automatically

## Why
- **Business Value**: Eliminate dependency on external Skool.com platform
- **User Experience**: Keep users within jk.toolchat.ai ecosystem
- **Integration**: Leverage existing AI coaching tools alongside learning content
- **Engagement**: Increase user retention with community features
- **Revenue**: Potential for course monetization in future phases

## What
### User-visible behavior:
- Academy sidebar (375px) with course navigation and community sections
- Course viewer with video player and markdown content
- Progress tracking with visual indicators
- Community forum with posts, replies, and categories
- Admin interface for course management
- Mobile-responsive design

### Technical requirements:
- MongoDB schemas for courses, modules, lessons, posts, progress
- Express API routes with existing auth middleware
- React components integrated into LibreChat UI
- Video embedding with YouTube/Vimeo APIs
- Real-time updates for forum activity
- Admin-only content management

### Success Criteria
- [ ] Users can browse and watch courses without leaving jk.toolchat.ai
- [ ] Video progress is automatically tracked and persisted
- [ ] Forum posts update in real-time
- [ ] Admins can create/edit courses in under 10 minutes
- [ ] All features work on mobile devices
- [ ] Page load times under 2 seconds

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://www.librechat.ai/docs/development/architecture
  why: LibreChat architecture overview and conventions
  
- url: https://www.librechat.ai/docs/development/database
  why: MongoDB model patterns and best practices
  
- url: https://www.librechat.ai/docs/development/frontend
  why: React component structure and state management
  
- url: https://developers.google.com/youtube/iframe_api_reference
  why: YouTube player API for video progress tracking
  
- url: https://developer.vimeo.com/player/sdk
  why: Vimeo player SDK for alternative video platform
  
- url: https://socket.io/docs/v4/
  why: Real-time updates for forum posts/replies
  
- file: /packages/data-schemas/src/schema/agent.ts
  why: Reference for MongoDB schema patterns with versioning
  
- file: /api/models/User.js
  why: User model extensions for admin flags and tier system
  
- file: /client/src/hooks/Nav/useSideNavLinks.ts
  why: Pattern for adding new sidebar navigation items
  
- file: /client/src/routes/Dashboard.tsx
  why: Pattern for dashboard-style routes with nested views
  
- file: /api/server/middleware/roles/admin.js
  why: Admin middleware for content management routes

- docfile: lms.md
  why: Original feature specification with examples
```

### Current Codebase tree
```bash
./api/
  ./server/
    ./routes/       # API endpoints
    ./models/       # Business logic
    ./middleware/   # Auth and validation
    ./services/     # Core services
    ./controllers/  # Request handlers
./client/
  ./src/
    ./components/   # React components
    ./hooks/        # Custom hooks
    ./routes/       # Route definitions
    ./store/        # State management
    ./Providers/    # Context providers
./packages/
  ./data-schemas/ # Shared schemas
  ./data-provider/ # API client
```

### Desired Codebase tree with files to be added
```bash
# Backend - API Routes and Services
./api/server/routes/lms/
  index.js          # Main LMS routes aggregator
  courses.js        # Course CRUD endpoints
  modules.js        # Module management
  lessons.js        # Lesson endpoints
  progress.js       # Progress tracking
  forum.js          # Forum posts/replies
  admin.js          # Admin-only routes

./api/server/services/LMS/
  CourseService.js      # Course business logic
  ProgressService.js    # Progress tracking logic
  ForumService.js       # Forum operations
  VideoService.js       # Video provider integration
  index.js             # Service exports

./api/server/controllers/lms/
  CourseController.js   # Course request handlers
  ForumController.js    # Forum handlers
  ProgressController.js # Progress handlers
  index.js             # Controller exports

# Database Schemas
./packages/data-schemas/src/schema/lms/
  course.ts         # Course schema
  module.ts         # Module schema
  lesson.ts         # Lesson schema
  progress.ts       # User progress schema
  forumPost.ts      # Forum post schema
  forumReply.ts     # Reply schema
  forumCategory.ts  # Category schema

# Frontend - React Components
./client/src/components/Academy/
  AcademySidebar.tsx      # Main sidebar component
  CourseList.tsx          # Course listing
  CourseViewer.tsx        # Course content viewer
  VideoPlayer.tsx         # Video player wrapper
  LessonContent.tsx       # Markdown content
  ProgressIndicator.tsx   # Progress visualization
  
./client/src/components/Forum/
  ForumCategories.tsx     # Category listing
  PostList.tsx            # Posts in category
  PostViewer.tsx          # Single post view
  CreatePost.tsx          # New post form
  ReplyForm.tsx           # Reply composer
  ForumSearch.tsx         # Search interface

./client/src/components/Admin/Academy/
  CourseBuilder.tsx       # Course creation
  ModuleEditor.tsx        # Module management
  LessonEditor.tsx        # Lesson editing
  ForumModeration.tsx     # Moderation tools

# Routes
./client/src/routes/Academy/
  index.tsx              # Academy routes
  CourseRoute.tsx        # Course viewer route
  ForumRoute.tsx         # Forum route

# Hooks and State
./client/src/hooks/Academy/
  useCourseProgress.ts   # Progress tracking
  useVideoPlayer.ts      # Video integration
  useForumUpdates.ts     # Real-time updates

./client/src/store/academy.ts  # Academy state management
```

### Known Gotchas & Library Quirks
```javascript
// CRITICAL: LibreChat uses custom MongoDB connection management
// Always use createModel pattern from data-schemas package

// CRITICAL: Authentication is handled by requireJwtAuth middleware
// Never create new auth patterns - use existing middleware

// CRITICAL: Admin check uses SystemRoles.ADMIN from librechat-data-provider
// Example: req.user.role !== SystemRoles.ADMIN

// CRITICAL: React Query is used for data fetching
// Use existing patterns from data-provider package

// CRITICAL: File uploads go to /images/{userId}/ directory
// Maintain this pattern for course assets

// GOTCHA: Socket.io not currently used in LibreChat
// Will need to add WebSocket support for real-time forum
```

## Implementation Blueprint

### Data models and structure

Create MongoDB schemas following LibreChat patterns:
```typescript
// Course Schema (packages/data-schemas/src/schema/lms/course.ts)
const courseSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  thumbnail: { type: String },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  modules: [{ type: Schema.Types.ObjectId, ref: 'Module' }],
  isPublished: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Progress Schema with compound index
const progressSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  lesson: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
  watchTime: { type: Number, default: 0 }, // seconds watched
  completed: { type: Boolean, default: false },
  lastPosition: { type: Number, default: 0 }, // video position
  completedAt: Date
}, { timestamps: true });

progressSchema.index({ user: 1, course: 1, lesson: 1 }, { unique: true });
```

### List of tasks to be completed in order

```yaml
Task 1: Create MongoDB Schemas
LOCATION: packages/data-schemas/src/schema/lms/
  - CREATE course.ts following agent.ts pattern
  - CREATE module.ts with course reference
  - CREATE lesson.ts with video metadata
  - CREATE progress.ts with compound indexes
  - CREATE forumPost.ts with author/category
  - CREATE forumReply.ts with threading
  - CREATE forumCategory.ts for organization
  - ADD model factories in packages/data-schemas/src/models/

Task 2: Implement Backend Services
LOCATION: api/server/services/LMS/
  - CREATE CourseService.js with CRUD operations
  - IMPLEMENT getCourseWithProgress method
  - CREATE ProgressService.js with tracking logic
  - IMPLEMENT updateVideoProgress with position saving
  - CREATE ForumService.js with post/reply methods
  - ADD real-time emit events for forum updates

Task 3: Create API Routes
LOCATION: api/server/routes/lms/
  - CREATE courses.js with GET/POST/PUT/DELETE
  - ADD requireJwtAuth to all routes
  - ADD checkAdmin middleware to write operations
  - CREATE progress.js with PUT /progress/video
  - CREATE forum.js with pagination support
  - REGISTER routes in api/server/routes/index.js

Task 4: Update User Model
MODIFY api/models/User.js:
  - ADD isAdmin field if not exists
  - ADD courseProgress virtual field
  - ENSURE compatibility with existing auth

Task 5: Create Academy Sidebar
LOCATION: client/src/components/Academy/
  - CREATE AcademySidebar.tsx using SidePanel patterns
  - IMPLEMENT course navigation tree
  - ADD community section toggle
  - STYLE with 375px width per spec
  - INTEGRATE with existing nav system

Task 6: Build Course Viewer Components
LOCATION: client/src/components/Academy/
  - CREATE VideoPlayer.tsx with YouTube/Vimeo support
  - IMPLEMENT progress tracking callbacks
  - CREATE LessonContent.tsx for markdown
  - ADD next/previous navigation
  - BUILD responsive layout

Task 7: Implement Forum Components
LOCATION: client/src/components/Forum/
  - CREATE PostList.tsx with infinite scroll
  - IMPLEMENT CreatePost.tsx with markdown editor
  - ADD ReplyForm.tsx with threading
  - BUILD real-time update listeners
  - ADD like/bookmark functionality

Task 8: Add Academy Routes
MODIFY client/src/routes/index.tsx:
  - ADD academy route configuration
  - CREATE Academy layout component
  - IMPLEMENT course/:courseId route
  - ADD forum/:categoryId route
  - ENSURE auth protection

Task 9: Create Admin Interface
LOCATION: client/src/components/Admin/Academy/
  - CREATE CourseBuilder.tsx with drag-drop
  - IMPLEMENT lesson video URL input
  - ADD markdown editor for content
  - BUILD publish/unpublish toggle
  - CREATE bulk import tools

Task 10: Add WebSocket Support
MODIFY api/server/index.js:
  - ADD Socket.io initialization
  - IMPLEMENT forum namespaces
  - ADD authentication middleware
  - CREATE event handlers
  - ENSURE scalability

Task 11: Implement Video Progress Tracking
LOCATION: client/src/hooks/Academy/
  - CREATE useVideoPlayer.ts hook
  - IMPLEMENT progress save debouncing
  - ADD resume from position
  - HANDLE video completion
  - SYNC with backend

Task 12: Add Navigation Integration
MODIFY client/src/hooks/Nav/useSideNavLinks.ts:
  - ADD Academy link to nav
  - IMPLEMENT icon and translation
  - ENSURE proper ordering
  - ADD permission checks
```

### Integration Points
```yaml
DATABASE:
  - migration: "Add LMS collections: courses, modules, lessons, progress, forum_posts"
  - indexes: "CREATE INDEX idx_progress_lookup ON progress(user, course)"
  - indexes: "CREATE INDEX idx_forum_category ON forum_posts(category, createdAt)"
  
CONFIG:
  - add to: librechat.yaml
  - section: "interface.sidePanel.academy: true"
  - section: "interface.features.lms: true"
  
ROUTES:
  - add to: api/server/routes/index.js
  - pattern: "app.use('/api/lms', requireJwtAuth, lmsRoutes);"
  
NAVIGATION:
  - add to: client/src/hooks/Nav/useSideNavLinks.ts
  - pattern: "{ title: 'Academy', icon: GraduationCap, id: 'academy', Component: AcademySidebar }"
  
PERMISSIONS:
  - extend: SystemRoles with CONTENT_CREATOR
  - add: Permission checks for course management
```

## Validation Loop

### Level 1: Backend Validation
```bash
# Lint and type check new files
npm run lint:api
npm run check:types

# Test MongoDB schemas
npm run test:api -- --testPathPattern=lms

# Verify routes are registered
curl http://localhost:3080/api/lms/courses
# Expected: 401 without auth, 200 with valid JWT
```

### Level 2: Frontend Validation
```bash
# Build frontend with new components
npm run build:client

# Check for TypeScript errors
npm run check:types

# Test component rendering
npm run test:client -- Academy
```

### Level 3: Integration Tests
```bash
# Start development servers
npm run backend:dev  # Terminal 1
npm run frontend:dev # Terminal 2

# Test course creation (as admin)
curl -X POST http://localhost:3080/api/lms/courses \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Course", "description": "Test"}'

# Test video progress update
curl -X PUT http://localhost:3080/api/lms/progress/video \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"lessonId": "123", "watchTime": 120, "position": 120}'

# Verify Academy sidebar appears
# Navigate to http://localhost:5173
# Check for Academy icon in sidebar
```

### Level 4: Real-time Forum Test
```bash
# Connect two browser sessions
# Create post in session 1
# Verify appears in session 2 without refresh

# Monitor WebSocket connections
# Check browser console for socket events
```

## Final Validation Checklist
- [ ] All MongoDB schemas created and indexed
- [ ] API routes protected with auth middleware
- [ ] Admin-only routes use checkAdmin middleware
- [ ] Academy sidebar integrates with existing nav
- [ ] Video progress saves and resumes correctly
- [ ] Forum posts update in real-time
- [ ] Mobile responsive design works
- [ ] Course builder allows easy content creation
- [ ] All components follow LibreChat patterns
- [ ] No new authentication patterns introduced
- [ ] File uploads maintain /images/{userId}/ pattern
- [ ] Translations added for new UI elements

---

## Anti-Patterns to Avoid
- ❌ Don't create new auth systems - use requireJwtAuth
- ❌ Don't bypass MongoDB connection management
- ❌ Don't create new UI patterns - follow existing components
- ❌ Don't hardcode video providers - use config
- ❌ Don't skip permission checks on admin routes
- ❌ Don't create synchronous blocking operations
- ❌ Don't store large video files - use streaming URLs

## Migration Strategy
- Export existing Skool content to JSON
- Create import script using Course/Module/Lesson schemas
- Map Skool categories to forum categories
- Preserve user discussions where possible
- Test with subset before full migration

## Performance Considerations
- Use MongoDB aggregation for course progress stats
- Implement cursor pagination for forum posts
- Cache course structure in Redis if needed
- Lazy load video player components
- Use React.memo for static course content
- Debounce progress updates to prevent spam

## Security Requirements
- All course content requires authentication
- Admin flag required for content management
- Sanitize markdown content to prevent XSS
- Validate video URLs against whitelist
- Rate limit forum post creation
- Implement spam detection for forum

## Future Enhancements (Phase 2)
- Live cohort sessions with video conferencing
- Assignment submissions and grading
- AI-powered Q&A within lessons
- Certificate generation
- Gamification with badges
- Course analytics dashboard

---

**Confidence Score: 9/10**

This PRP provides comprehensive context for implementing the LMS feature in a single pass. The integration points are well-defined, following existing LibreChat patterns. The only complexity is adding WebSocket support for real-time forum updates, which may require additional configuration.