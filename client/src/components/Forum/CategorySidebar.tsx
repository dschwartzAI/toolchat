import React from 'react';
import { MessageCircle, Hash, Users, BookOpen } from 'lucide-react';
import { cn } from '~/utils';
import { useLocalize } from '~/hooks';
import type { ForumCategory } from '~/data-provider/Academy/types';

interface CategorySidebarProps {
  categories: ForumCategory[];
  selectedCategoryId: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  className?: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  general: <MessageCircle className="h-4 w-4" />,
  help: <Users className="h-4 w-4" />,
  resources: <BookOpen className="h-4 w-4" />,
  default: <Hash className="h-4 w-4" />
};

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  selectedCategoryId,
  onCategorySelect,
  className
}) => {
  const localize = useLocalize();

  return (
    <div className={cn('w-64 border-r border-border-light bg-surface-secondary', className)}>
      <div className="p-4">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          {localize('com_academy_categories')}
        </h2>

        <div className="space-y-1">
          {/* All posts */}
          <button
            onClick={() => onCategorySelect(null)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
              'hover:bg-surface-hover',
              selectedCategoryId === null && 'bg-surface-tertiary text-blue-600'
            )}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="font-medium">{localize('com_academy_all_posts')}</span>
          </button>

          {/* Categories */}
          {categories.map((category) => {
            const icon = categoryIcons[category.slug] || categoryIcons.default;
            const isSelected = selectedCategoryId === category._id;

            return (
              <button
                key={category._id}
                onClick={() => onCategorySelect(category._id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  'hover:bg-surface-hover',
                  isSelected && 'bg-surface-tertiary text-blue-600'
                )}
              >
                {icon}
                <div className="flex-1 text-left">
                  <div className="font-medium">{category.name}</div>
                  {category.description && (
                    <div className="text-xs text-text-secondary line-clamp-1">
                      {category.description}
                    </div>
                  )}
                </div>
                {category.postCount !== undefined && (
                  <span className="text-xs text-text-secondary bg-surface-primary px-2 py-0.5 rounded-full">
                    {category.postCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Stats */}
        <div className="mt-6 pt-6 border-t border-border-light">
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            {localize('com_academy_community_stats')}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">{localize('com_academy_total_posts')}</span>
              <span className="font-medium text-text-primary">
                {categories.reduce((sum, cat) => sum + (cat.postCount || 0), 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">{localize('com_academy_categories')}</span>
              <span className="font-medium text-text-primary">{categories.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategorySidebar;