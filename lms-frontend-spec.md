LibreChat LMS Frontend Implementation Spec
FEATURE: Frontend Components and Routes for LMS Platform
Complete the frontend implementation of the Learning Management System, building on the existing backend infrastructure. Create React components for course viewing, video playback, forum interactions, and admin management interfaces.

Core Components:

Video Player System: YouTube/Vimeo iframe integration with progress tracking
Course Viewer: Lesson display with markdown rendering and navigation
Forum Interface: Post creation, replies, real-time updates
Academy Routes: React Router configuration for all LMS pages
Admin Builder: Drag-and-drop course creation and management
Progress Tracking: Video watch time synchronization with backend

Technical Requirements:

React components using existing LibreChat UI patterns
TypeScript for all new components
TanStack Query for data fetching (already configured)
Tailwind CSS with existing design tokens
Mobile-responsive layouts
Accessibility compliance (WCAG 2.1 AA)

EXAMPLES:
In the examples/ folder:

examples/components/VideoPlayer.tsx - YouTube/Vimeo player with progress callbacks
examples/components/CourseViewer.tsx - Main course viewing interface
examples/components/LessonContent.tsx - Markdown lesson renderer
examples/components/ForumPost.tsx - Forum post component with replies
examples/routes/AcademyRoutes.tsx - Route configuration for Academy
examples/hooks/useVideoProgress.ts - Video progress tracking hook
examples/admin/CourseBuilder.tsx - Admin course creation interface

IMPLEMENTATION TASKS:

## Task 1: Video Player Component
CREATE client/src/components/Academy/VideoPlayer.tsx:
  - YouTube iframe API integration
  - Vimeo Player SDK integration
  - Progress event handlers (timeupdate, ended)
  - Resume from last position
  - Fullscreen support
  - Mobile-responsive player

Key Features:
```typescript
interface VideoPlayerProps {
  videoUrl: string;
  provider: 'youtube' | 'vimeo' | 'custom';
  lessonId: string;
  initialPosition?: number;
  onProgress: (time: number, duration: number) => void;
  onComplete: () => void;
}

// YouTube API events
onStateChange: (event) => {
  if (event.data === YT.PlayerState.ENDED) {
    onComplete();
  }
}

// Progress tracking with debounce
const debouncedProgress = useMemo(
  () => debounce((time, duration) => {
    updateVideoProgress({ lessonId, watchTime: time, position: time, duration });
  }, 5000),
  [lessonId]
);
```

## Task 2: Course Viewer Components
CREATE client/src/components/Academy/CourseViewer.tsx:
  - Course header with title, description, progress
  - Module accordion navigation
  - Lesson list with completion status
  - Next/Previous lesson navigation
  - Mobile-friendly sidebar toggle

CREATE client/src/components/Academy/LessonContent.tsx:
  - Markdown rendering with syntax highlighting
  - Resource downloads section
  - Lesson completion button
  - Comments/Questions section (future)

## Task 3: Forum Components
CREATE client/src/components/Forum/PostList.tsx:
  - Infinite scroll with intersection observer
  - Post preview cards
  - Sort options (recent, popular, active)
  - Category filtering
  - Search functionality

CREATE client/src/components/Forum/PostViewer.tsx:
  - Full post content with markdown
  - Reply thread with nesting
  - Like/bookmark actions
  - Edit/delete for authors
  - Report functionality

CREATE client/src/components/Forum/CreatePost.tsx:
  - Rich text editor (markdown)
  - Category selection
  - Tag input
  - Preview mode
  - Draft saving

CREATE client/src/components/Forum/ReplyForm.tsx:
  - Inline reply editor
  - Mention user functionality
  - Quote parent post
  - Markdown preview

## Task 4: Academy Routes
CREATE client/src/routes/Academy/index.tsx:
```typescript
const AcademyRoutes = {
  path: 'academy',
  element: <AcademyLayout />,
  children: [
    {
      index: true,
      element: <CourseCatalog />,
    },
    {
      path: 'course/:courseId',
      element: <CourseViewer />,
    },
    {
      path: 'lesson/:lessonId',
      element: <LessonViewer />,
    },
    {
      path: 'forum',
      element: <ForumHome />,
    },
    {
      path: 'forum/category/:categoryId',
      element: <CategoryView />,
    },
    {
      path: 'forum/post/:postId',
      element: <PostView />,
    },
    {
      path: 'admin',
      element: <RequireAdmin />,
      children: [
        {
          path: 'courses',
          element: <CourseManager />,
        },
        {
          path: 'courses/:courseId/edit',
          element: <CourseEditor />,
        },
      ],
    },
  ],
};
```

MODIFY client/src/routes/index.tsx:
  - Import and add AcademyRoutes to router configuration

## Task 5: Video Progress Tracking Hook
CREATE client/src/hooks/Academy/useVideoPlayer.ts:
```typescript
export const useVideoPlayer = (lessonId: string) => {
  const { mutate: updateProgress } = useUpdateVideoProgressMutation();
  const { data: lessonProgress } = useGetLessonProgressQuery(lessonId);
  
  const handleProgress = useCallback((time: number, duration: number) => {
    updateProgress({
      lessonId,
      watchTime: Math.floor(time),
      position: time,
      duration,
    });
  }, [lessonId, updateProgress]);

  const handleComplete = useCallback(() => {
    completeLessonMutation(lessonId);
  }, [lessonId]);

  return {
    initialPosition: lessonProgress?.lastPosition || 0,
    onProgress: handleProgress,
    onComplete: handleComplete,
  };
};
```

## Task 6: Admin Course Builder
CREATE client/src/components/Admin/Academy/CourseBuilder.tsx:
  - Drag-and-drop module reordering
  - Module CRUD operations
  - Lesson management within modules
  - Course settings (publish, tags, thumbnail)
  - Preview mode

CREATE client/src/components/Admin/Academy/LessonEditor.tsx:
  - Video URL input with validation
  - Markdown editor for text lessons
  - Resource file uploads
  - Duration estimation
  - Save draft functionality

## Task 7: Real-time Forum Updates (WebSocket)
MODIFY api/server/index.js:
```javascript
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: process.env.DOMAIN_CLIENT,
    credentials: true,
  },
});

io.on('connection', (socket) => {
  socket.on('join-forum', (categoryId) => {
    socket.join(`forum-${categoryId}`);
  });

  socket.on('new-post', (post) => {
    io.to(`forum-${post.category}`).emit('post-created', post);
  });

  socket.on('new-reply', ({ postId, reply }) => {
    io.emit('reply-created', { postId, reply });
  });
});
```

CREATE client/src/hooks/Academy/useForumUpdates.ts:
  - Socket.io client connection
  - Real-time post/reply listeners
  - Optimistic updates
  - Connection state management

## UI/UX Patterns to Follow:

1. **Loading States**: Use existing Skeleton components
2. **Error Handling**: Toast notifications for errors
3. **Empty States**: Helpful messages with action buttons
4. **Animations**: Framer Motion for smooth transitions
5. **Icons**: Lucide React icons matching existing usage
6. **Forms**: React Hook Form with existing validation patterns
7. **Modals**: Use existing Dialog components
8. **Tables**: DataTable component for admin interfaces

## Mobile Considerations:

1. **Video Player**: Native controls on mobile
2. **Navigation**: Bottom sheet for lesson navigation
3. **Forum**: Swipe actions for post interactions
4. **Course List**: Card layout on mobile, table on desktop
5. **Admin**: Responsive forms with stacked layout

## Performance Optimizations:

1. **Code Splitting**: Lazy load Academy routes
2. **Image Optimization**: Next/image for course thumbnails
3. **Infinite Scroll**: Virtual scrolling for long lists
4. **Caching**: Aggressive caching of course structure
5. **Prefetching**: Prefetch next lesson content

## Accessibility Requirements:

1. **Keyboard Navigation**: Full keyboard support
2. **Screen Readers**: Proper ARIA labels
3. **Focus Management**: Logical tab order
4. **Color Contrast**: WCAG AA compliance
5. **Video Captions**: Support for closed captions

## Testing Strategy:

1. **Component Tests**: Jest + React Testing Library
2. **Integration Tests**: Cypress for user flows
3. **Accessibility Tests**: axe-core integration
4. **Visual Regression**: Storybook + Chromatic
5. **Performance Tests**: Lighthouse CI

## State Management:

1. **Course State**: Zustand store (already created)
2. **Video State**: Local component state
3. **Forum State**: TanStack Query cache
4. **Form State**: React Hook Form
5. **UI State**: URL params for filters/sorting

## Error Handling:

1. **Network Errors**: Retry with exponential backoff
2. **Video Errors**: Fallback to direct link
3. **Permission Errors**: Redirect to access denied
4. **Validation Errors**: Inline form errors
5. **Server Errors**: Error boundary with refresh

## Security Considerations:

1. **XSS Prevention**: Sanitize markdown content
2. **CSRF Protection**: Use existing token system
3. **File Uploads**: Validate file types and sizes
4. **Rate Limiting**: Implement on forum posts
5. **Content Moderation**: Report system for posts

## Future Enhancements:

1. **Live Classes**: WebRTC integration
2. **Assignments**: File submission system
3. **Certificates**: PDF generation on completion
4. **Analytics**: Detailed progress dashboards
5. **Gamification**: Points and achievements
6. **AI Assistant**: Context-aware help within lessons

## Success Metrics:

- Video completion rate > 70%
- Forum engagement: 3+ posts per active user/month
- Mobile usage > 40% of total traffic
- Page load time < 1.5 seconds
- Accessibility score > 95/100

DELIVERABLES:
1. Fully functional video player with progress tracking
2. Complete course viewing experience
3. Interactive forum with real-time updates
4. Admin course management interface
5. Mobile-responsive design for all components
6. Comprehensive error handling and loading states

This specification provides the blueprint for completing the LMS frontend implementation, ensuring consistency with LibreChat's existing patterns while delivering a modern learning experience.