import React, { useState, useEffect } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useGetForumCategoriesQuery, useGetForumPostsQuery } from '~/data-provider';
import { Filter } from 'lucide-react';
import PostCreator from './PostCreator';
import PostPreview from './PostPreview';
import store from '~/store';
import { cn } from '~/utils';

const CommunityTab: React.FC = () => {
  const [expandedPosts, setExpandedPosts] = useRecoilState(store.expandedPosts);
  const [forumPosts, setForumPosts] = useRecoilState(store.forumPosts);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const currentUser = useRecoilValue(store.user);
  
  const { data: categoriesData, isLoading: categoriesLoading } = useGetForumCategoriesQuery();
  const { data: postsData, isLoading: postsLoading } = useGetForumPostsQuery({
    categoryId: selectedCategory === 'all' ? null : selectedCategory,
    sortBy: 'recent'
  });

  // Extract posts from paginated response
  const posts = postsData?.pages?.[0]?.posts || postsData?.posts || [];
  const categories = Array.isArray(categoriesData) ? categoriesData : [];

  // Initialize forum posts with query data on first load
  useEffect(() => {
    if (posts.length > 0 && forumPosts.length === 0) {
      setForumPosts(posts);
    }
  }, [posts]);

  const handleCreatePost = (newPost: { title: string; content: string; category: string }) => {
    // In real implementation, this would call a mutation
    const mockPost = {
      _id: `post-${Date.now()}`,
      title: newPost.title,
      content: newPost.content,
      author: {
        _id: currentUser?.id || 'current-user',
        name: currentUser?.name || currentUser?.username || 'You',
        avatar: currentUser?.avatar || null
      },
      category: categories.find(c => c._id === newPost.category) || { name: 'General' },
      likeCount: 0,
      replyCount: 0,
      createdAt: new Date().toISOString(),
      isLiked: false,
      comments: []
    };
    
    setForumPosts([mockPost, ...forumPosts]);
  };

  const togglePostExpansion = (postId: string) => {
    const newExpanded = new Set(expandedPosts);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedPosts(newExpanded);
  };

  const handleLikePost = (postId: string) => {
    // In real implementation, this would call a mutation
    setForumPosts(posts => posts.map(post => 
      post._id === postId 
        ? { ...post, isLiked: !post.isLiked, likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1 }
        : post
    ));
  };

  const handleAddComment = (postId: string, content: string, parentId?: string) => {
    // In real implementation, this would call a mutation
    const newComment = {
      _id: `comment-${Date.now()}`,
      content,
      author: {
        _id: currentUser?.id || 'current-user',
        name: currentUser?.name || currentUser?.username || 'You',
        avatar: currentUser?.avatar || null
      },
      createdAt: new Date().toISOString(),
      likeCount: 0,
      isLiked: false,
      parentId: parentId
    };

    setForumPosts(posts => posts.map(post => 
      post._id === postId 
        ? { 
            ...post, 
            comments: [...(post.comments || []), newComment],
            replyCount: post.replyCount + 1
          }
        : post
    ));
  };

  const handleLikeComment = (postId: string, commentId: string) => {
    // In real implementation, this would call a mutation
    setForumPosts(posts => posts.map(post => 
      post._id === postId 
        ? { 
            ...post, 
            comments: post.comments?.map(comment => 
              comment._id === commentId 
                ? { ...comment, isLiked: !comment.isLiked, likeCount: comment.isLiked ? comment.likeCount - 1 : comment.likeCount + 1 }
                : comment
            ) || []
          }
        : post
    ));
  };

  // Use forumPosts as the source of truth since it contains all updates
  let allPosts = forumPosts.length > 0 ? forumPosts : posts;

  // Apply category filter
  if (selectedCategory !== 'all') {
    allPosts = allPosts.filter(post => post.category?._id === selectedCategory);
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {/* Category Filter */}
        <div className="p-4 pb-0">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-text-tertiary" />
            <div className="flex-1 flex gap-2 overflow-x-auto">
              <button
                onClick={() => setSelectedCategory('all')}
                className={cn(
                  "px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors",
                  selectedCategory === 'all'
                    ? "bg-green-500 text-white"
                    : "bg-surface-secondary text-text-secondary hover:bg-surface-hover"
                )}
              >
                All Categories
              </button>
              {categories.map(category => (
                <button
                  key={category._id}
                  onClick={() => setSelectedCategory(category._id)}
                  className={cn(
                    "px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors",
                    selectedCategory === category._id
                      ? "bg-green-500 text-white"
                      : "bg-surface-secondary text-text-secondary hover:bg-surface-hover"
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4">
          <PostCreator 
            categories={categories}
            onCreatePost={handleCreatePost}
          />

          {postsLoading && forumPosts.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            </div>
          ) : allPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-secondary">
                {selectedCategory !== 'all' 
                  ? 'No posts in this category yet.' 
                  : 'No posts yet. Be the first to share!'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {allPosts.map(post => (
                <PostPreview
                  key={post._id}
                  post={post}
                  isExpanded={expandedPosts.has(post._id)}
                  onToggleExpand={() => togglePostExpansion(post._id)}
                  onLike={() => handleLikePost(post._id)}
                  onAddComment={(content, parentId) => handleAddComment(post._id, content, parentId)}
                  onLikeComment={(commentId) => handleLikeComment(post._id, commentId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityTab;