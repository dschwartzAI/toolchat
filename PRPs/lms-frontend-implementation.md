name: "LMS Frontend Implementation for LibreChat"
description: |

## Purpose
Complete the frontend implementation of the Learning Management System for LibreChat, building on existing backend infrastructure. Create React components for video playback, course viewing, forum interactions, and admin management using established LibreChat patterns.

## Core Principles
1. **Pattern Consistency**: Follow existing LibreChat React patterns and conventions
2. **Type Safety**: Full TypeScript implementation with proper type definitions
3. **Performance First**: Optimize for large course catalogs and real-time interactions
4. **Accessibility**: WCAG 2.1 AA compliance with full keyboard navigation
5. **Mobile Responsive**: Mobile-first design with progressive enhancement
6. **Global rules**: Follow all rules in CLAUDE.md

---

## Goal
Build a complete LMS frontend that:
- Provides video playback with YouTube/Vimeo integration and progress tracking
- Delivers course content with intuitive navigation and progress visualization
- Enables community discussions with real-time updates
- Offers admin tools for course creation and management
- Maintains LibreChat's design language and user experience
- Works seamlessly on mobile and desktop devices

## Why
- **User Experience**: Seamless learning experience within the LibreChat ecosystem
- **Feature Completion**: Frontend needed to utilize the backend LMS infrastructure
- **Business Value**: Enable course monetization and user engagement
- **Platform Integration**: Leverage AI tools alongside educational content

## What
### User-visible features:
- Video player with progress tracking and resume functionality
- Course catalog with search and filtering
- Lesson viewer with markdown content and resources
- Community forum with real-time posts and replies
- Admin course builder with drag-and-drop interface
- Progress tracking across all courses

### Technical requirements:
- React components with TypeScript
- TanStack Query for data fetching
- React Hook Form for forms
- Tailwind CSS with existing design tokens
- Socket.io for real-time forum updates
- React Router v6 for navigation

### Success Criteria
- [ ] Video playback works on all major browsers
- [ ] Course progress persists across sessions
- [ ] Forum updates appear in real-time
- [ ] Admin can create courses in under 10 minutes
- [ ] All components are keyboard navigable
- [ ] Page load times under 1.5 seconds

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://react.dev/reference/react
  why: React 18 patterns and best practices
  
- url: https://react-hook-form.com/docs
  why: Form handling patterns used throughout LibreChat
  
- url: https://tanstack.com/query/latest/docs/react/overview
  why: Data fetching and caching patterns
  
- url: https://developers.google.com/youtube/iframe_api_reference
  why: YouTube player integration for video lessons
  
- url: https://developer.vimeo.com/player/sdk/reference
  why: Vimeo player integration alternative
  
- url: https://socket.io/docs/v4/client-api/
  why: Real-time forum updates implementation
  
- url: https://www.radix-ui.com/primitives/docs/components/dialog
  why: Dialog patterns used in LibreChat
  
- file: client/src/components/ui/DialogTemplate.tsx
  why: LibreChat's dialog template pattern
  
- file: client/src/components/SidePanel/Agents/AgentPanel.tsx
  why: Complex form patterns with React Hook Form
  
- file: client/src/components/Chat/Messages/Content/Markdown.tsx
  why: Markdown rendering patterns with plugins
  
- file: client/src/hooks/SSE/useSSE.ts
  why: Real-time streaming pattern (alternative to WebSocket)
  
- file: client/src/components/Conversations/Conversations.tsx
  why: Virtual scrolling implementation pattern
  
- file: client/src/components/Prompts/AdminSettings.tsx
  why: Admin interface patterns and permissions

- docfile: lms-frontend-spec.md
  why: Complete frontend specification with all requirements
```

### Current Codebase Structure
```bash
client/
  src/
    components/
      ui/               # Reusable UI components (Dialog, Button, etc.)
      Academy/          # LMS components (partially created)
      Forum/            # Forum components (to be created)
      Admin/            # Admin components
    hooks/              # Custom React hooks
      Academy/          # LMS-specific hooks
    routes/             # Route definitions
    store/              # Zustand state management
    data-provider/      # TanStack Query setup
```

### Known Gotchas & Library Patterns
```typescript
// CRITICAL: LibreChat uses Radix UI primitives wrapped with custom styling
// Always use the wrapped components from components/ui/

// CRITICAL: Form validation uses React Hook Form with register pattern
const { register, handleSubmit, formState: { errors } } = useForm<TFormData>();

// CRITICAL: Data fetching uses TanStack Query with custom hooks
// Never fetch directly in components - create query/mutation hooks

// CRITICAL: LibreChat uses cn() utility for conditional classes
import { cn } from '~/utils';

// GOTCHA: LibreChat uses SSE for streaming, not WebSocket for chat
// But we'll add Socket.io specifically for forum real-time updates

// GOTCHA: All text must use useLocalize() hook for i18n
const localize = useLocalize();
```

## Implementation Blueprint

### Component Architecture
```
VideoPlayer/
├── VideoPlayer.tsx         # Main player component
├── YouTubePlayer.tsx       # YouTube-specific implementation
├── VimeoPlayer.tsx         # Vimeo-specific implementation
├── VideoControls.tsx       # Custom control overlay
└── useVideoProgress.ts     # Progress tracking hook

CourseViewer/
├── CourseViewer.tsx        # Main course layout
├── ModuleAccordion.tsx     # Module navigation
├── LessonList.tsx          # Lesson items with status
├── CourseHeader.tsx        # Title, description, progress
└── CourseProgress.tsx      # Visual progress indicator

Forum/
├── ForumLayout.tsx         # Main forum container
├── PostList.tsx            # Virtual scrolling posts
├── PostCard.tsx            # Individual post preview
├── PostViewer.tsx          # Full post with replies
├── CreatePost.tsx          # Post creation form
├── ReplyThread.tsx         # Nested reply component
└── useForumSocket.ts       # Socket.io integration
```

### List of tasks to be completed in order

```yaml
Task 1: Create Video Player Components
LOCATION: client/src/components/Academy/VideoPlayer/
  - CREATE VideoPlayer.tsx with provider detection
  - CREATE YouTubePlayer.tsx with iframe API
  - CREATE VimeoPlayer.tsx with player SDK
  - IMPLEMENT progress tracking with debounce
  - ADD resume from last position
  - ENSURE mobile responsiveness

Task 2: Implement Course Viewer
LOCATION: client/src/components/Academy/CourseViewer/
  - CREATE CourseViewer.tsx with layout
  - BUILD ModuleAccordion with expand/collapse
  - IMPLEMENT LessonList with completion status
  - ADD CourseProgress visualization
  - CREATE navigation between lessons
  - STYLE with existing Tailwind tokens

Task 3: Build Forum Components
LOCATION: client/src/components/Forum/
  - CREATE PostList with virtual scrolling
  - IMPLEMENT PostCard with preview
  - BUILD PostViewer with markdown
  - ADD CreatePost with React Hook Form
  - CREATE ReplyThread with nesting
  - STYLE with dark/light mode support

Task 4: Add Socket.io Integration
LOCATION: client/src/hooks/Academy/
  - INSTALL socket.io-client package
  - CREATE useForumSocket hook
  - IMPLEMENT connection management
  - ADD event listeners for updates
  - HANDLE reconnection logic
  - INTEGRATE with TanStack Query

Task 5: Configure Academy Routes
LOCATION: client/src/routes/Academy/
  - CREATE index.tsx with route config
  - ADD lazy loading for components
  - IMPLEMENT route guards for admin
  - CREATE layout component
  - UPDATE main router configuration
  - ADD breadcrumb navigation

Task 6: Build Admin Interface
LOCATION: client/src/components/Admin/Academy/
  - CREATE CourseBuilder with drag-drop
  - IMPLEMENT ModuleManager
  - BUILD LessonEditor with preview
  - ADD video URL validation
  - CREATE publish workflow
  - STYLE with DataTable patterns

Task 7: Implement Progress Hooks
LOCATION: client/src/hooks/Academy/
  - CREATE useVideoPlayer hook
  - ADD progress debouncing
  - IMPLEMENT completion logic
  - BUILD useForumUpdates
  - ADD error recovery
  - OPTIMIZE for performance

Task 8: Add Markdown Components
LOCATION: client/src/components/Academy/
  - CREATE LessonContent renderer
  - ADD syntax highlighting
  - IMPLEMENT resource links
  - BUILD quiz components (future)
  - ENSURE safe rendering
  - STYLE consistently

Task 9: Implement Search and Filters
LOCATION: client/src/components/Academy/
  - CREATE CourseSearch component
  - ADD category filters
  - IMPLEMENT tag filtering
  - BUILD sort options
  - ADD pagination/infinite scroll
  - INTEGRATE with URL params

Task 10: Add Error Handling
LOCATION: throughout components
  - IMPLEMENT error boundaries
  - ADD loading skeletons
  - CREATE empty states
  - BUILD offline support
  - ADD retry mechanisms
  - SHOW user-friendly errors

Task 11: Optimize Performance
LOCATION: throughout
  - ADD React.memo where needed
  - IMPLEMENT code splitting
  - OPTIMIZE re-renders
  - ADD prefetching
  - CACHE course structure
  - LAZY load images

Task 12: Add Accessibility
LOCATION: throughout
  - ADD ARIA labels
  - IMPLEMENT keyboard nav
  - ENSURE focus management
  - ADD screen reader support
  - TEST with axe-core
  - DOCUMENT a11y features
```

### Detailed Implementation Patterns

#### Video Player Implementation
```typescript
// VideoPlayer.tsx
interface VideoPlayerProps {
  lessonId: string;
  videoUrl: string;
  provider: 'youtube' | 'vimeo' | 'custom';
  onProgress?: (time: number, duration: number) => void;
  onComplete?: () => void;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  lessonId,
  videoUrl,
  provider,
  onProgress,
  onComplete,
  className
}) => {
  const { data: progress } = useGetLessonProgressQuery(lessonId);
  const playerRef = useRef<any>(null);
  
  const PlayerComponent = useMemo(() => {
    switch (provider) {
      case 'youtube':
        return YouTubePlayer;
      case 'vimeo':
        return VimeoPlayer;
      default:
        return CustomPlayer;
    }
  }, [provider]);

  return (
    <div className={cn('relative aspect-video bg-black rounded-lg overflow-hidden', className)}>
      <PlayerComponent
        ref={playerRef}
        videoUrl={videoUrl}
        initialTime={progress?.lastPosition || 0}
        onProgress={onProgress}
        onComplete={onComplete}
      />
    </div>
  );
};
```

#### Form Pattern (Course Creation)
```typescript
// Following LibreChat's React Hook Form patterns
interface CourseFormData {
  title: string;
  description: string;
  thumbnail?: string;
  tags: string[];
  isPublished: boolean;
}

export const CourseForm: React.FC = () => {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const createCourse = useCreateCourseMutation();
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CourseFormData>({
    defaultValues: {
      title: '',
      description: '',
      tags: [],
      isPublished: false,
    },
  });

  const onSubmit = (data: CourseFormData) => {
    createCourse.mutate(data, {
      onSuccess: () => {
        showToast({ message: localize('com_academy_course_created') });
      },
      onError: (error) => {
        showToast({ message: error.message, status: 'error' });
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormInput
        label={localize('com_academy_course_title')}
        {...register('title', { 
          required: localize('com_academy_title_required'),
          maxLength: { value: 200, message: localize('com_academy_title_too_long') }
        })}
        error={errors.title}
      />
      {/* More fields following same pattern */}
    </form>
  );
};
```

#### Virtual Scrolling Pattern
```typescript
// Following LibreChat's react-virtualized pattern
export const ForumPostList: React.FC = () => {
  const { data, fetchNextPage, hasNextPage } = useGetForumPostsQuery(categoryId);
  
  const cache = useMemo(
    () => new CellMeasurerCache({
      fixedWidth: true,
      defaultHeight: 150,
    }),
    []
  );

  const rowRenderer = ({ index, key, parent, style }) => {
    const post = data.pages.flatMap(page => page.posts)[index];
    
    return (
      <CellMeasurer cache={cache} columnIndex={0} key={key} rowIndex={index} parent={parent}>
        <div style={style}>
          <PostCard post={post} />
        </div>
      </CellMeasurer>
    );
  };

  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          height={height}
          width={width}
          rowCount={data.pages.flatMap(page => page.posts).length}
          rowHeight={cache.rowHeight}
          rowRenderer={rowRenderer}
          onScroll={({ scrollTop, scrollHeight, clientHeight }) => {
            if (scrollTop + clientHeight >= scrollHeight - 100 && hasNextPage) {
              fetchNextPage();
            }
          }}
        />
      )}
    </AutoSizer>
  );
};
```

### Integration Points
```yaml
STATE_MANAGEMENT:
  - file: client/src/store/academy.ts
  - status: Already created with course/forum state
  
DATA_FETCHING:
  - file: client/src/data-provider/Academy/
  - status: Queries and mutations already created
  
NAVIGATION:
  - file: client/src/hooks/Nav/useSideNavLinks.ts
  - status: Academy link already added
  
TRANSLATIONS:
  - file: client/src/locales/en/translation.json
  - add: All Academy-related translations
  
ROUTES:
  - file: client/src/routes/index.tsx
  - add: Import and include AcademyRoutes
```

## Validation Loop

### Level 1: Type Checking
```bash
# TypeScript validation
npm run check:types

# Expected: No type errors
# If errors: Fix type definitions
```

### Level 2: Linting
```bash
# ESLint validation
npm run lint

# Expected: No linting errors
# If errors: Fix code style issues
```

### Level 3: Component Tests
```bash
# Run component tests
npm run test:client -- Academy

# Create test files for each component:
# - VideoPlayer.test.tsx
# - CourseViewer.test.tsx
# - ForumPost.test.tsx
```

### Level 4: Build Validation
```bash
# Build frontend
npm run build:client

# Expected: Successful build
# Check: Bundle size analysis
```

### Level 5: Manual Testing
```bash
# Start development server
npm run frontend:dev

# Test flows:
# 1. Browse courses
# 2. Watch video with progress
# 3. Create forum post
# 4. Admin course creation
# 5. Mobile responsiveness
```

### Level 6: Accessibility Testing
```bash
# Run axe-core tests
npm run test:a11y

# Manual testing:
# - Keyboard navigation
# - Screen reader testing
# - Color contrast check
```

## Final Validation Checklist
- [ ] All TypeScript types properly defined
- [ ] Forms use React Hook Form pattern
- [ ] Data fetching uses TanStack Query
- [ ] Components follow LibreChat patterns
- [ ] Proper error handling with toasts
- [ ] Loading states with skeletons
- [ ] Mobile responsive design
- [ ] Keyboard navigation works
- [ ] Translations added for all text
- [ ] Real-time forum updates working
- [ ] Video progress tracking functional
- [ ] Admin can manage courses

---

## Anti-Patterns to Avoid
- ❌ Don't fetch data directly in components - use query hooks
- ❌ Don't use inline styles - use Tailwind classes
- ❌ Don't hardcode text - use localize() hook
- ❌ Don't create new UI patterns - use existing components
- ❌ Don't skip loading/error states
- ❌ Don't ignore TypeScript errors
- ❌ Don't bypass authentication checks

## Performance Optimizations
- Use React.memo for static components
- Implement virtual scrolling for long lists
- Lazy load route components
- Debounce video progress updates
- Cache course structure aggressively
- Prefetch next lesson content
- Optimize bundle with code splitting

## Security Considerations
- Sanitize all markdown content
- Validate video URLs on frontend
- Check permissions before showing admin UI
- Implement CSRF protection for forms
- Rate limit forum post creation
- Validate file uploads client-side

## Troubleshooting Guide
- **Video not playing**: Check CORS headers, validate URL format
- **Progress not saving**: Verify debounce timing, check network tab
- **Forum not updating**: Check Socket.io connection, verify events
- **Forms not submitting**: Check validation errors, network requests
- **Styles broken**: Verify Tailwind classes, check dark mode

---

**Confidence Score: 8.5/10**

This PRP provides comprehensive implementation guidance with specific code patterns from LibreChat. The main complexity is Socket.io integration for real-time forum updates, which is new to the codebase. All other patterns follow existing LibreChat conventions, making implementation straightforward.