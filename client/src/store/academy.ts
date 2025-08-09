import { atom, selector } from 'recoil';

// Types
interface Course {
  _id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  isPublished: boolean;
  modules: Module[];
  progress?: CourseProgress;
}

interface Module {
  _id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
  order: number;
}

interface Lesson {
  _id: string;
  title: string;
  description?: string;
  type: 'video' | 'text' | 'quiz';
  videoUrl?: string;
  content?: string;
  progress?: LessonProgress;
}

interface LessonProgress {
  watchTime: number;
  completed: boolean;
  lastPosition: number;
}

interface CourseProgress {
  totalLessons: number;
  completedLessons: number;
  totalWatchTime: number;
  percentComplete: number;
}

interface ForumPost {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    name: string;
    avatar?: string;
  };
  category: string;
  likeCount: number;
  replyCount: number;
  createdAt: string;
  lastReplyAt?: string;
}

// Atoms
const coursesState = atom<Course[]>({
  key: 'academyCourses',
  default: [],
});

const currentCourseState = atom<Course | null>({
  key: 'academyCurrentCourse',
  default: null,
});

const currentLessonState = atom<Lesson | null>({
  key: 'academyCurrentLesson',
  default: null,
});

const isLoadingState = atom<boolean>({
  key: 'academyIsLoading',
  default: false,
});

const errorState = atom<string | null>({
  key: 'academyError',
  default: null,
});

const forumPostsState = atom<ForumPost[]>({
  key: 'academyForumPosts',
  default: [],
});

const currentPostState = atom<ForumPost | null>({
  key: 'academyCurrentPost',
  default: null,
});

const categoriesState = atom<any[]>({
  key: 'academyCategories',
  default: [],
});

// Selectors
const enrolledCoursesSelector = selector({
  key: 'academyEnrolledCourses',
  get: ({ get }) => {
    const courses = get(coursesState);
    return courses.filter((course) => course.progress !== undefined);
  },
});

const currentCourseProgressSelector = selector({
  key: 'academyCurrentCourseProgress',
  get: ({ get }) => {
    const currentCourse = get(currentCourseState);
    return currentCourse?.progress || null;
  },
});

// UI state atoms
const expandedPostsState = atom<Set<string>>({
  key: 'academyExpandedPosts',
  default: new Set(),
});

const panelWidthState = atom<number>({
  key: 'academyPanelWidth',
  default: 320, // w-80
});

const activeTabState = atom<'community' | 'classroom' | 'calendar'>({
  key: 'academyActiveTab',
  default: 'community',
});

const newPostContentState = atom<{ title: string; content: string; category: string }>({
  key: 'academyNewPostContent',
  default: { title: '', content: '', category: '' },
});

// Export atoms and selectors
export default {
  courses: coursesState,
  currentCourse: currentCourseState,
  currentLesson: currentLessonState,
  isLoading: isLoadingState,
  error: errorState,
  forumPosts: forumPostsState,
  currentPost: currentPostState,
  categories: categoriesState,
  enrolledCourses: enrolledCoursesSelector,
  currentCourseProgress: currentCourseProgressSelector,
  expandedPosts: expandedPostsState,
  panelWidth: panelWidthState,
  activeTab: activeTabState,
  newPostContent: newPostContentState,
};