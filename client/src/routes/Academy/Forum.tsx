import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Plus, Search, TrendingUp, Clock, Users } from 'lucide-react';
import { useGetForumCategoriesQuery, useGetForumPostsQuery } from '~/data-provider';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

export default function Forum() {
  const navigate = useNavigate();
  const localize = useLocalize();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'unanswered'>('recent');

  const { data: categoriesData, isLoading: categoriesLoading } = useGetForumCategoriesQuery();
  const { data: postsData, isLoading: postsLoading } = useGetForumPostsQuery({
    categoryId: selectedCategory === 'all' ? null : selectedCategory,
    sortBy
  });
  
  // Ensure categories is always an array
  const categories = Array.isArray(categoriesData) ? categoriesData : [];

  const handleCreatePost = () => {
    navigate('/academy/forum/new');
  };

  const handlePostClick = (postId: string) => {
    navigate(`/academy/forum/posts/${postId}`);
  };

  // Extract posts from the paginated response
  const posts = postsData?.pages?.[0]?.posts || [];
  
  const filteredPosts = posts.filter(post => 
    searchQuery === '' || 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-border-light p-4">
        <button
          onClick={handleCreatePost}
          className="w-full flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors mb-6"
        >
          <Plus className="w-4 h-4" />
          New Post
        </button>

        <h3 className="font-medium mb-3">Categories</h3>
        <div className="space-y-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg transition-colors",
              selectedCategory === 'all' 
                ? "bg-surface-hover text-text-primary" 
                : "text-text-secondary hover:bg-surface-hover"
            )}
          >
            All Categories
          </button>
          {categoriesLoading ? (
            <div className="px-3 py-2 text-sm text-text-tertiary">Loading categories...</div>
          ) : categories.length > 0 ? (
            categories.map((category) => (
              <button
                key={category._id}
                onClick={() => setSelectedCategory(category._id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg transition-colors",
                  selectedCategory === category._id 
                    ? "bg-surface-hover text-text-primary" 
                    : "text-text-secondary hover:bg-surface-hover"
                )}
              >
                {category.name}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-text-tertiary">No categories available</div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-border-light p-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Community Forum</h1>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search discussions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-surface-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              {/* Sort */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy('recent')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                    sortBy === 'recent' 
                      ? "bg-surface-hover text-text-primary" 
                      : "text-text-secondary hover:bg-surface-hover"
                  )}
                >
                  <Clock className="w-4 h-4" />
                  Recent
                </button>
                <button
                  onClick={() => setSortBy('popular')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                    sortBy === 'popular' 
                      ? "bg-surface-hover text-text-primary" 
                      : "text-text-secondary hover:bg-surface-hover"
                  )}
                >
                  <TrendingUp className="w-4 h-4" />
                  Popular
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {postsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No posts found</h3>
                <p className="text-text-secondary">
                  {searchQuery ? 'Try a different search term' : 'Be the first to start a discussion!'}
                </p>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <div
                  key={post._id}
                  onClick={() => handlePostClick(post._id)}
                  className="bg-surface-secondary rounded-lg p-4 hover:bg-surface-hover cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-medium hover:text-green-500 transition-colors">
                      {post.title}
                    </h3>
                    {post.isAnswered && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                        Answered
                      </span>
                    )}
                  </div>
                  
                  <p className="text-text-secondary line-clamp-2 mb-3">
                    {post.content}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-text-tertiary">
                    <div className="flex items-center gap-1">
                      <img
                        src={post.author.avatar || '/default-avatar.png'}
                        alt={post.author.name}
                        className="w-5 h-5 rounded-full"
                      />
                      <span>{post.author.name}</span>
                    </div>
                    <span>•</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.replyCount} replies</span>
                    </div>
                    <span>•</span>
                    <span>{post.viewCount} views</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}