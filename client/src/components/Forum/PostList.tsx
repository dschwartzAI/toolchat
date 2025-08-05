import React, { useRef, useCallback, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '~/utils';
import PostCard from './PostCard';
import { Spinner } from '~/components/svg';
import { useGetForumPostsQuery } from '~/data-provider/Academy';
import { useForumSocket } from '~/hooks/Academy/useForumSocket';
import { useLocalize } from '~/hooks';

interface PostListProps {
  categoryId: string | null;
  searchQuery: string;
  sortBy: 'latest' | 'popular' | 'unanswered';
  className?: string;
}

export const PostList: React.FC<PostListProps> = ({
  categoryId,
  searchQuery,
  sortBy,
  className
}) => {
  const localize = useLocalize();
  const listRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useGetForumPostsQuery({
    categoryId,
    search: searchQuery,
    sortBy,
    limit: 20
  });

  // Use forum socket for real-time updates
  useForumSocket({
    onNewPost: (post) => {
      // Real-time updates will be handled by React Query invalidation
    },
    onPostUpdate: (postId, updates) => {
      // Real-time updates will be handled by React Query invalidation
    }
  });

  const allPosts = data?.pages.flatMap(page => page.posts) || [];

  const virtualizer = useVirtualizer({
    count: allPosts.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 150, // Estimated height of PostCard
    overscan: 5
  });

  const items = virtualizer.getVirtualItems();

  // Load more when scrolling near bottom
  useEffect(() => {
    const lastItem = items[items.length - 1];
    if (!lastItem) return;

    if (
      lastItem.index >= allPosts.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [items, allPosts.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">{localize('com_academy_forum_load_error')}</p>
      </div>
    );
  }

  if (allPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-text-secondary mb-4">
          {searchQuery
            ? localize('com_academy_no_posts_search')
            : localize('com_academy_no_posts')}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      className={cn('h-full overflow-auto', className)}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {items.map((virtualItem) => {
          const post = allPosts[virtualItem.index];
          if (!post) return null;

          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`
              }}
            >
              <PostCard post={post} />
            </div>
          );
        })}
      </div>

      {isFetchingNextPage && (
        <div className="flex justify-center p-4">
          <Spinner className="h-6 w-6" />
        </div>
      )}
    </div>
  );
};

export default PostList;