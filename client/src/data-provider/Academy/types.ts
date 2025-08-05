export interface TGetCoursesResponse {
  courses: TCourse[];
  total: number;
}

export interface TGetModulesResponse {
  modules: TModule[];
  total: number;
}

export interface TCourse {
  _id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  author: {
    _id: string;
    name: string;
    avatar?: string;
  };
  isPublished: boolean;
  modules?: TModule[];
  progress?: TCourseProgress;
  enrollmentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TModule {
  _id: string;
  title: string;
  description?: string;
  course?: string; // Made optional for standalone modules
  lessons?: TLesson[]; // Made optional for MVP
  order: number;
  duration?: number;
  // New fields for standalone modules
  thumbnail?: string;
  videoUrl?: string;
  textContent?: {
    header: string;
    subtext: string;
  };
  resources?: Array<{
    title: string;
    url: string;
  }>;
  transcript?: string;
  isPublished?: boolean;
}

export interface TLesson {
  _id: string;
  title: string;
  description?: string;
  module: string;
  type: 'video' | 'text' | 'quiz';
  content?: string;
  videoUrl?: string;
  videoProvider?: 'youtube' | 'vimeo' | 'custom';
  videoDuration?: number;
  order: number;
  progress?: TLessonProgress;
}

export interface TLessonProgress {
  watchTime: number;
  completed: boolean;
  lastPosition: number;
  completedAt?: string;
}

export interface TCourseProgress {
  totalLessons: number;
  completedLessons: number;
  totalWatchTime: number;
  percentComplete: number;
}

export interface TForumCategory {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  icon?: string;
  order: number;
  isActive: boolean;
  postCount: number;
  lastPostAt?: string;
}

export interface TForumPost {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    name: string;
    avatar?: string;
  };
  category: string | TForumCategory;
  tags: string[];
  views: number;
  likes: string[];
  likeCount: number;
  replyCount: number;
  lastReplyAt?: string;
  lastReplyBy?: {
    _id: string;
    name: string;
  };
  isPinned: boolean;
  isLocked: boolean;
  replies?: TForumReply[];
  userLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TForumReply {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    avatar?: string;
  };
  post: string;
  parentReply?: string;
  likes: string[];
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}