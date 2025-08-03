import { useCallback } from 'react';
import { TagIcon, Trash2 } from 'lucide-react';
import { useConversationTagsQuery, useDeleteConversationTagMutation } from '~/data-provider';
import { NotificationSeverity } from '~/common';
import { useToastContext } from '~/Providers';
import { useLocalize, useAuthContext } from '~/hooks';
import { Spinner } from '~/components';
import { cn } from '~/utils';

export default function TagsTab() {
  const localize = useLocalize();
  const { user } = useAuthContext();
  const { showToast } = useToastContext();
  const { data: tags, isLoading } = useConversationTagsQuery();

  const deleteTagMutation = useDeleteConversationTagMutation({
    onSuccess: () => {
      showToast({
        message: localize('com_ui_tags_delete_success'),
      });
    },
    onError: () => {
      showToast({
        message: localize('com_ui_tags_delete_error'),
        severity: NotificationSeverity.ERROR,
      });
    },
  });

  const handleDelete = useCallback(
    (tag: string) => {
      deleteTagMutation.mutate(tag);
    },
    [deleteTagMutation],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner />
      </div>
    );
  }

  if (!tags || tags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <TagIcon className="size-12 text-text-secondary opacity-50" />
        <p className="text-text-secondary">{localize('com_endpoint_no_tags')}</p>
        <p className="text-sm text-text-tertiary">
          {localize('com_ui_tags_create_first')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold text-text-primary">
          {localize('com_ui_tags_manage')}
        </h3>
        <p className="mt-1 text-sm text-text-secondary">
          {localize('com_ui_tags_description')}
        </p>
      </div>

      <div className="divide-y divide-border-light">
        {tags.map((tag) => (
          <div
            key={tag.tag}
            className="group flex items-center justify-between px-3 py-3 transition-colors hover:bg-surface-hover"
          >
            <div className="flex items-center gap-3">
              <TagIcon className="size-4 text-text-secondary" />
              <span className="text-sm text-text-primary">{tag.tag}</span>
              {tag.count != null && tag.count > 0 && (
                <span className="text-xs text-text-tertiary">
                  ({tag.count} {localize('com_ui_tags_conversations')})
                </span>
              )}
            </div>
            <button
              onClick={() => handleDelete(tag.tag)}
              disabled={deleteTagMutation.isLoading}
              className={cn(
                'rounded p-1.5 text-text-secondary transition-all',
                'opacity-0 group-hover:opacity-100',
                'hover:bg-surface-tertiary hover:text-text-primary',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
              aria-label={`${localize('com_ui_delete')} ${tag.tag}`}
            >
              {deleteTagMutation.isLoading ? (
                <Spinner className="size-4" />
              ) : (
                <Trash2 className="size-4" />
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-2 text-xs text-text-tertiary">
        {localize('com_ui_tags_count', { count: tags.length })}
      </div>
    </div>
  );
}