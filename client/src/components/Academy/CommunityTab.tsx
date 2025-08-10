import React, { useState, useEffect } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useGetForumCategoriesQuery, useGetForumPostsQuery } from '~/data-provider';
import { 
  useCreateForumPostMutation,
  useCreateForumReplyMutation,
  useDeletePostMutation,
  useDeleteReplyMutation,
  usePinPostMutation,
  useUpdatePostMutation
} from '~/data-provider/Academy/forumMutations';
import { Filter } from 'lucide-react';
import PostCreator from './PostCreator';
import PostPreview from './PostPreview';
import store from '~/store';
import { cn } from '~/utils';
import { useToastContext } from '~/Providers';

const CommunityTab: React.FC = () => {
  const [expandedPosts, setExpandedPosts] = useRecoilState(store.expandedPosts);
  const [forumPosts, setForumPosts] = useRecoilState(store.forumPosts);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deletedReplyIds, setDeletedReplyIds] = useState<Set<string>>(new Set());
  const currentUser = useRecoilValue(store.user);
  const { showToast } = useToastContext();
  
  const { data: categoriesData, isLoading: categoriesLoading } = useGetForumCategoriesQuery();
  const { data: postsData, isLoading: postsLoading } = useGetForumPostsQuery({
    categoryId: selectedCategory === 'all' ? null : selectedCategory,
    sortBy: 'recent'
  });
  
  const createPostMutation = useCreateForumPostMutation({
    onSuccess: (newPost) => {
      // Add the new post to local state immediately with proper formatting
      if (newPost) {
        // Ensure the post has the expected structure
        const formattedPost = {
          ...newPost,
          category: newPost.category || { name: 'General', _id: 'general' },
          comments: newPost.comments || [],
          likeCount: newPost.likeCount || 0,
          replyCount: newPost.replyCount || 0,
          isLiked: false,
          isPinned: false
        };
        setForumPosts(posts => [formattedPost, ...posts]);
      }
      showToast({ 
        message: 'Post created successfully!', 
        status: 'success' 
      });
    },
    onError: (error) => {
      console.error('[CommunityTab] Error creating post:', error);
      showToast({ 
        message: 'Failed to create post. Please try again.', 
        status: 'error' 
      });
    }
  });
  
  const deletePostMutation = useDeletePostMutation({
    onSuccess: (data) => {
      // Don't do optimistic updates - let React Query handle the refresh
      showToast({ 
        message: 'Post deleted successfully', 
        status: 'success' 
      });
    },
    onError: (error: any) => {
      console.error('[CommunityTab] Error deleting post:', error);
      console.error('[CommunityTab] Error response:', error.response);
      console.error('[CommunityTab] Error data:', error.response?.data);
      showToast({ 
        message: error.response?.data?.error || 'Failed to delete post', 
        status: 'error' 
      });
    }
  });
  
  const deleteReplyMutation = useDeleteReplyMutation({
    onSuccess: (data, replyId) => {
      // Track deleted id to suppress reappearance on immediate refetch
      setDeletedReplyIds(prev => {
        const next = new Set(prev);
        if (replyId) next.add(replyId as string);
        return next;
      });
      // Auto-expire suppression after 60s
      setTimeout(() => {
        setDeletedReplyIds(prev => {
          const next = new Set(prev);
          next.delete(replyId as string);
          return next;
        });
      }, 60000);

      // Optimistically remove the deleted comment from local state
      setForumPosts(posts => posts.map(post => {
        const prevLen = post.comments?.length || 0;
        const filtered = (post.comments || []).filter(c => c._id !== replyId);
        const newLen = filtered.length;
        if (newLen !== prevLen) {
          return { ...post, comments: filtered, replyCount: Math.max((post.replyCount || 0) - 1, 0) };
        }
        return post;
      }));

      showToast({ 
        message: 'Comment deleted successfully', 
        status: 'success' 
      });
    },
    onError: (error: any) => {
      console.error('[CommunityTab] Error deleting reply:', error);
      showToast({ 
        message: error.response?.data?.error || 'Failed to delete comment', 
        status: 'error' 
      });
    }
  });
  
  const pinPostMutation = usePinPostMutation({
    onSuccess: (data) => {
      showToast({ 
        message: data?.pinned ? 'Post pinned to top' : 'Post unpinned', 
        status: 'success' 
      });
    },
    onError: (error: any) => {
      console.error('[CommunityTab] Error toggling pin:', error);
      showToast({ 
        message: error.response?.data?.error || 'Failed to toggle pin', 
        status: 'error' 
      });
    }
  });
  
  const updatePostMutation = useUpdatePostMutation({
    onSuccess: () => {
      showToast({ 
        message: 'Post updated successfully', 
        status: 'success' 
      });
    },
    onError: (error: any) => {
      console.error('[CommunityTab] Error updating post:', error);
      showToast({ 
        message: error.response?.data?.error || 'Failed to update post', 
        status: 'error' 
      });
    }
  });
  
  const createReplyMutation = useCreateForumReplyMutation({
    onSuccess: (newReply, variables) => {
      // Add the reply to local state immediately
      if (newReply) {
        const formattedReply = {
          ...newReply,
          author: newReply.author || {
            _id: currentUser?.id || 'current-user',
            name: currentUser?.name || currentUser?.username || 'You',
            avatar: currentUser?.avatar || null
          },
          likeCount: newReply.likeCount || 0,
          isLiked: false
        };
        
        setForumPosts(posts => posts.map(post => 
          post._id === variables.postId 
            ? { 
                ...post, 
                comments: [...(post.comments || []), formattedReply],
                replyCount: (post.replyCount || 0) + 1
              }
            : post
        ));
      }
      showToast({ 
        message: 'Comment added successfully!', 
        status: 'success' 
      });
    },
    onError: (error: any) => {
      console.error('[CommunityTab] Error creating reply:', error);
      showToast({ 
        message: error.response?.data?.error || 'Failed to add comment', 
        status: 'error' 
      });
    }
  });

  // Extract posts from paginated response - this is our source of truth
  const posts = postsData?.pages?.[0]?.posts || postsData?.posts || [];
  const categories = Array.isArray(categoriesData) ? categoriesData : [];

  // Sync local state with fresh API data when query data changes
  useEffect(() => {
    // Update local state when we get new data from the API
    if (posts && posts.length >= 0) {
      // Filter out recently deleted replies so they don't flicker back in
      const filtered = posts.map(p => ({
        ...p,
        comments: (p.comments || []).filter((c: any) => !deletedReplyIds.has(c._id))
      }));
      setForumPosts(filtered);
    }
  }, [postsData, deletedReplyIds]); // Recompute when suppression set changes

  // Use forumPosts as the render source so optimistic updates are visible
  // Use posts from API as source of truth (already synced to forumPosts in useEffect)
  let allPosts = forumPosts;

  // Apply category filter
  if (selectedCategory !== 'all') {
    allPosts = allPosts.filter(post => post.category?._id === selectedCategory);
  }

  // Sort posts with pinned posts first
  allPosts = [...allPosts].sort((a, b) => {
    // Pinned posts always come first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    // Otherwise sort by creation date
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleCreatePost = async (newPost: { title: string; content: string; category: string }) => {
    try {
      const postData = {
        title: newPost.title,
        content: newPost.content,
        categoryId: newPost.category,
        tags: []
      };
      await createPostMutation.mutateAsync(postData);
    } catch (error: any) {
      console.error('[CommunityTab] Failed to create post:', error);
    }
  };
  
  const handleDeletePost = async (postId: string) => {
    // Find the post to get its title for the confirmation
    const post = posts.find(p => p._id === postId);
    const confirmed = window.confirm(`Are you sure you want to delete this post?\n\n"${post?.title || 'this post'}"\n\nThis action cannot be undone.`);
    
    if (!confirmed) return;
    
    console.log('[CommunityTab] User confirmed deletion of post:', postId);
    
    try {
      const result = await deletePostMutation.mutateAsync(postId);
      console.log('[CommunityTab] Delete post result:', result);
      // React Query will handle the refresh - no manual state update needed
    } catch (error: any) {
      console.error('[CommunityTab] Failed to delete post:', error);
    }
  };
  
  const handleDeleteComment = async (commentId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this comment?\n\nThis action cannot be undone.');
    
    if (!confirmed) return;
    
    console.log('[CommunityTab] User confirmed deletion of comment:', commentId);
    
    try {
      // Delete comment from server
      await deleteReplyMutation.mutateAsync(commentId);
      console.log('[CommunityTab] Delete comment successful:', commentId);
      // The mutation will invalidate the cache and trigger a refetch
      // No need for optimistic update since we're using fresh API data
    } catch (error: any) {
      console.error('[CommunityTab] Failed to delete comment:', error);
    }
  };
  
  // No longer need confirmDelete function since we're using window.confirm directly

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

  const handleAddComment = async (postId: string, content: string, parentId?: string) => {
    try {
      await createReplyMutation.mutateAsync({
        postId,
        content,
        parentReplyId: parentId
      });
    } catch (error: any) {
      console.error('[CommunityTab] Failed to create comment:', error);
    }
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
  
  const handleTogglePin = async (postId: string) => {
    try {
      const result = await pinPostMutation.mutateAsync(postId);
      // Update local state to reflect the pin status
      setForumPosts(posts => posts.map(p => 
        p._id === postId 
          ? { ...p, isPinned: result?.pinned }
          : result?.pinned ? { ...p, isPinned: false } : p // Unpin others if this was pinned
      ));
    } catch (error) {
      console.error('[CommunityTab] Failed to toggle pin:', error);
    }
  };
  
  const handleEditPost = async (postId: string, title: string, content: string) => {
    try {
      await updatePostMutation.mutateAsync({ 
        postId, 
        updates: { title, content } 
      });
      // Update local state
      setForumPosts(posts => posts.map(p => 
        p._id === postId 
          ? { ...p, title, content }
          : p
      ));
    } catch (error) {
      console.error('[CommunityTab] Failed to edit post:', error);
    }
  };

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

          {postsLoading && posts.length === 0 ? (
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
                  onDeletePost={() => handleDeletePost(post._id)}
                  onDeleteComment={handleDeleteComment}
                  onTogglePin={() => handleTogglePin(post._id)}
                  onEditPost={(title, content) => handleEditPost(post._id, title, content)}
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