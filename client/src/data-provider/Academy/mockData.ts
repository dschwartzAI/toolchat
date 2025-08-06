// Mock data for Academy development
export const mockCourses = {
  courses: [
    {
      _id: 'course1',
      title: 'Introduction to AI Agents',
      description: 'Learn how to build and deploy AI agents using LibreChat',
      thumbnail: 'https://via.placeholder.com/400x225?text=AI+Agents',
      author: {
        _id: 'user1',
        name: 'John Doe',
        avatar: null
      },
      modules: [
        {
          _id: 'module1',
          title: 'Getting Started',
          description: 'Introduction to AI concepts',
          order: 0,
          lessons: [
            {
              _id: 'lesson1',
              title: 'What are AI Agents?',
              description: 'Understanding the basics',
              type: 'video',
              videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              duration: 600,
              order: 0,
              isLocked: false
            },
            {
              _id: 'lesson2',
              title: 'Setting up LibreChat',
              description: 'Installation and configuration',
              type: 'text',
              content: '# Setting up LibreChat\n\nThis lesson covers installation...',
              order: 1,
              isLocked: false
            }
          ]
        },
        {
          _id: 'module2',
          title: 'Advanced Concepts',
          description: 'Deep dive into agent architecture',
          order: 1,
          lessons: [
            {
              _id: 'lesson3',
              title: 'Agent Memory Systems',
              description: 'How agents remember context',
              type: 'video',
              videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              duration: 900,
              order: 0,
              isLocked: true
            }
          ]
        }
      ],
      isPublished: true,
      enrolledCount: 42,
      createdAt: new Date('2024-01-15').toISOString(),
      updatedAt: new Date('2024-01-20').toISOString()
    },
    {
      _id: 'course2',
      title: 'Prompt Engineering Masterclass',
      description: 'Master the art of crafting effective prompts',
      thumbnail: 'https://via.placeholder.com/400x225?text=Prompt+Engineering',
      author: {
        _id: 'user2',
        name: 'Jane Smith',
        avatar: null
      },
      modules: [],
      isPublished: true,
      enrolledCount: 128,
      createdAt: new Date('2024-01-10').toISOString(),
      updatedAt: new Date('2024-01-18').toISOString()
    }
  ]
};

export const mockForumCategories = [
  {
    _id: 'cat1',
    name: 'Ask',
    slug: 'ask',
    description: 'Ask questions and get help from the community',
    postCount: 45
  },
  {
    _id: 'cat2',
    name: 'Share',
    slug: 'share',
    description: 'Share your knowledge, resources, and experiences',
    postCount: 38
  },
  {
    _id: 'cat3',
    name: 'Update',
    slug: 'update',
    description: 'Share updates on your progress and projects',
    postCount: 27
  },
  {
    _id: 'cat4',
    name: 'Win',
    slug: 'win',
    description: 'Celebrate your victories and successes',
    postCount: 19
  },
  {
    _id: 'cat5',
    name: 'Syndicate',
    slug: 'syndicate',
    description: 'Cross-post content and share from other platforms',
    postCount: 8
  }
];

export const mockForumPosts = {
  posts: [
    {
      _id: 'post1',
      title: 'How to integrate custom tools with agents?',
      content: 'I\'m trying to add custom tools to my agent but running into issues. Can someone help me understand the proper way to configure custom tools? I\'ve tried following the documentation but I\'m getting errors when I attempt to register my tool. Has anyone successfully integrated custom APIs as tools?',
      author: {
        _id: 'user3',
        name: 'Mike Wilson',
        avatar: 'https://ui-avatars.com/api/?name=Mike+Wilson&background=10a37f&color=fff'
      },
      category: mockForumCategories[0], // Ask category
      tags: ['agents', 'tools', 'integration'],
      viewCount: 234,
      replyCount: 5,
      likeCount: 12,
      isPinned: false,
      isAnswered: true,
      isLiked: false,
      createdAt: new Date('2024-08-04T10:00:00').toISOString(),
      updatedAt: new Date('2024-08-04T15:30:00').toISOString(),
      lastReplyAt: new Date('2024-08-04T15:30:00').toISOString(),
      comments: [
        {
          _id: 'comment1',
          content: 'You need to add the tool to the librechat.yaml file under the agents section. Make sure to include the proper configuration.',
          author: {
            _id: 'user8',
            name: 'Tom Anderson',
            avatar: 'https://ui-avatars.com/api/?name=Tom+Anderson&background=f97316&color=fff'
          },
          createdAt: new Date('2024-08-04T11:00:00').toISOString(),
          likeCount: 3,
          isLiked: false
        },
        {
          _id: 'comment2',
          content: 'Thanks Tom! That worked perfectly. I was missing the endpoint URL in the config.',
          author: {
            _id: 'user3',
            name: 'Mike Wilson',
            avatar: 'https://ui-avatars.com/api/?name=Mike+Wilson&background=10a37f&color=fff'
          },
          createdAt: new Date('2024-08-04T12:30:00').toISOString(),
          likeCount: 1,
          isLiked: true,
          parentId: 'comment1'
        },
        {
          _id: 'comment4',
          content: '@Mike Wilson Glad it worked! For anyone else having this issue, make sure you restart the server after updating the config.',
          author: {
            _id: 'user8',
            name: 'Tom Anderson',
            avatar: 'https://ui-avatars.com/api/?name=Tom+Anderson&background=f97316&color=fff'
          },
          createdAt: new Date('2024-08-04T13:00:00').toISOString(),
          likeCount: 2,
          isLiked: false,
          parentId: 'comment2'
        }
      ]
    },
    {
      _id: 'post2',
      title: 'Best practices for agent memory management',
      content: 'Let\'s discuss strategies for managing agent memory effectively. I\'ve noticed that after long conversations, my agents start to lose context. What are your strategies for maintaining relevant context while avoiding token limit issues? I\'ve tried summarization but wondering if there are better approaches.',
      author: {
        _id: 'user4',
        name: 'Sarah Chen',
        avatar: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=ab68ff&color=fff'
      },
      category: mockForumCategories[1], // Share category
      tags: ['memory', 'best-practices', 'performance'],
      viewCount: 567,
      replyCount: 12,
      likeCount: 34,
      isPinned: true,
      isAnswered: false,
      isLiked: false,
      createdAt: new Date('2024-08-03T14:00:00').toISOString(),
      updatedAt: new Date('2024-08-04T09:15:00').toISOString(),
      lastReplyAt: new Date('2024-08-04T09:15:00').toISOString()
    },
    {
      _id: 'post3',
      title: 'Introducing myself - New to LibreChat!',
      content: 'Hi everyone! I just started using LibreChat and I\'m amazed by all the features. I\'m particularly interested in building agents for customer support. Looking forward to learning from this community and sharing my journey. Any tips for beginners would be greatly appreciated!',
      author: {
        _id: 'user5',
        name: 'Alex Johnson',
        avatar: 'https://ui-avatars.com/api/?name=Alex+Johnson&background=5865f2&color=fff'
      },
      category: mockForumCategories[2], // Update category
      tags: ['introduction', 'beginner'],
      viewCount: 89,
      replyCount: 8,
      likeCount: 23,
      isPinned: false,
      isAnswered: false,
      isLiked: true,
      createdAt: new Date('2024-08-05T08:30:00').toISOString(),
      updatedAt: new Date('2024-08-05T11:45:00').toISOString(),
      lastReplyAt: new Date('2024-08-05T11:45:00').toISOString(),
      comments: [
        {
          _id: 'comment3',
          content: 'Welcome to the community! For customer support agents, I recommend starting with the prompt engineering course. It really helps understand how to craft effective system prompts.',
          author: {
            _id: 'user4',
            name: 'Sarah Chen',
            avatar: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=ab68ff&color=fff'
          },
          createdAt: new Date('2024-08-05T09:00:00').toISOString(),
          likeCount: 5,
          isLiked: false
        }
      ]
    },
    {
      _id: 'post4',
      title: 'Collection of useful prompts for business coaching agents',
      content: 'I\'ve been compiling effective prompts for business coaching scenarios. These have been tested with various models and consistently produce good results. Happy to share my collection if anyone is interested. Also looking for feedback and suggestions to improve them further.',
      author: {
        _id: 'user6',
        name: 'Emma Davis',
        avatar: 'https://ui-avatars.com/api/?name=Emma+Davis&background=ed4245&color=fff'
      },
      category: mockForumCategories[1], // Share category
      tags: ['prompts', 'resources', 'business'],
      viewCount: 445,
      replyCount: 27,
      likeCount: 89,
      isPinned: false,
      isAnswered: false,
      isLiked: false,
      createdAt: new Date('2024-08-02T16:20:00').toISOString(),
      updatedAt: new Date('2024-08-05T09:00:00').toISOString(),
      lastReplyAt: new Date('2024-08-05T09:00:00').toISOString()
    },
    {
      _id: 'post5',
      title: 'Need help with agent response formatting',
      content: 'My agent responses are coming out as plain text but I need them formatted with markdown. I\'ve tried adding instructions to the system prompt but it\'s inconsistent. Does anyone know the best way to ensure consistent markdown formatting in agent responses?',
      author: {
        _id: 'user7',
        name: 'James Miller',
        avatar: 'https://ui-avatars.com/api/?name=James+Miller&background=57c7e3&color=fff'
      },
      category: mockForumCategories[0], // Ask category
      tags: ['formatting', 'markdown', 'help'],
      viewCount: 156,
      replyCount: 3,
      likeCount: 7,
      isPinned: false,
      isAnswered: true,
      isLiked: false,
      createdAt: new Date('2024-08-05T13:15:00').toISOString(),
      updatedAt: new Date('2024-08-05T14:30:00').toISOString(),
      lastReplyAt: new Date('2024-08-05T14:30:00').toISOString()
    },
    {
      _id: 'post6',
      title: 'Just landed my first AI consulting client using LibreChat agents!',
      content: 'Super excited to share that I just closed my first enterprise client for AI consulting! I built a custom agent demo using LibreChat that blew them away. The ability to integrate multiple models and tools in one platform was the key differentiator. Thanks to everyone who helped me troubleshoot issues along the way!',
      author: {
        _id: 'user9',
        name: 'Lisa Park',
        avatar: 'https://ui-avatars.com/api/?name=Lisa+Park&background=22c55e&color=fff'
      },
      category: mockForumCategories[3], // Win category
      tags: ['success', 'client', 'consulting'],
      viewCount: 892,
      replyCount: 15,
      likeCount: 67,
      isPinned: false,
      isAnswered: false,
      isLiked: true,
      createdAt: new Date('2024-08-05T16:00:00').toISOString(),
      updatedAt: new Date('2024-08-05T18:45:00').toISOString(),
      lastReplyAt: new Date('2024-08-05T18:45:00').toISOString(),
      comments: []
    }
  ],
  hasMore: true,
  total: 80
};

export const mockUserEnrollments = [
  {
    courseId: 'course1',
    enrolledAt: new Date('2024-07-01').toISOString(),
    progress: {
      percentComplete: 35,
      completedLessons: ['lesson1'],
      totalTimeSpent: 1800,
      lastAccessedAt: new Date('2024-08-04').toISOString()
    }
  }
];

export const mockCourseProgress = {
  courseId: 'course1',
  percentComplete: 35,
  lessonsCompleted: 1,
  totalLessons: 3,
  completedLessons: ['lesson1'],
  lastAccessedAt: new Date('2024-08-04').toISOString()
};

export const mockLessonProgress = {
  lessonId: 'lesson1',
  completed: true,
  lastPosition: 0,
  percentComplete: 100,
  completedAt: new Date('2024-08-03').toISOString()
};