import React, { useState } from 'react';
import { Plus, Search, Filter, TrendingUp } from 'lucide-react';
import { cn } from '~/utils';
import { Button } from '~/components/ui';
import PostList from './PostList';
import CreatePost from './CreatePost';
import CategorySidebar from './CategorySidebar';
import { useLocalize } from '~/hooks';
import { useGetForumCategoriesQuery } from '~/data-provider/Academy';

interface ForumLayoutProps {
  className?: string;
}

export const ForumLayout: React.FC<ForumLayoutProps> = ({ className }) => {
  const localize = useLocalize();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'unanswered'>('latest');

  const { data: categories } = useGetForumCategoriesQuery();

  return (
    <div className={cn('flex h-full', className)}>
      {/* Sidebar */}
      <CategorySidebar
        categories={categories || []}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={setSelectedCategoryId}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border-light px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-text-primary">
              {localize('com_academy_community_forum')}
            </h1>
            <Button
              onClick={() => setShowCreatePost(true)}
              variant="submit"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {localize('com_academy_new_post')}
            </Button>
          </div>

          {/* Search and filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={localize('com_academy_search_forum')}
                className="w-full pl-10 pr-4 py-2 bg-surface-secondary rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={sortBy === 'latest' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('latest')}
              >
                {localize('com_academy_latest')}
              </Button>
              <Button
                variant={sortBy === 'popular' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('popular')}
                className="gap-1"
              >
                <TrendingUp className="h-4 w-4" />
                {localize('com_academy_popular')}
              </Button>
              <Button
                variant={sortBy === 'unanswered' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('unanswered')}
              >
                {localize('com_academy_unanswered')}
              </Button>
            </div>
          </div>
        </div>

        {/* Posts list */}
        <div className="flex-1 overflow-hidden">
          <PostList
            categoryId={selectedCategoryId}
            searchQuery={searchQuery}
            sortBy={sortBy}
          />
        </div>
      </div>

      {/* Create post dialog */}
      {showCreatePost && (
        <CreatePost
          isOpen={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          categoryId={selectedCategoryId}
        />
      )}
    </div>
  );
};

export default ForumLayout;