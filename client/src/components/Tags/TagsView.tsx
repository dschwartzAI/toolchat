import { useState, useCallback } from 'react';
import { TagIcon, Trash2 } from 'lucide-react';
import { OGDialog, OGDialogContent, OGDialogHeader, OGDialogTitle, Spinner } from '~/components';
import { useConversationTagsQuery, useDeleteConversationTagMutation } from '~/data-provider';
import { NotificationSeverity } from '~/common';
import { useToastContext } from '~/Providers';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

export default function TagsView({ open, onOpenChange }) {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const { data: tags, isLoading } = useConversationTagsQuery();
  const [deletingTag, setDeletingTag] = useState<string | null>(null);

  const deleteTagMutation = useDeleteConversationTagMutation({
    onSuccess: () => {
      showToast({
        message: localize('com_ui_tags_delete_success'),
      });
      setDeletingTag(null);
    },
    onError: (error) => {
      // Only show error if the tag wasn't actually deleted
      if (tags?.some(b => b.tag === deletingTag)) {
        showToast({
          message: localize('com_ui_tags_delete_error'),
          severity: NotificationSeverity.ERROR,
        });
      }
      setDeletingTag(null);
    },
  });

  const handleDelete = useCallback(
    (tag: string) => {
      setDeletingTag(tag);
      deleteTagMutation.mutate(tag);
    },
    [deleteTagMutation],
  );

  return (
    <OGDialog open={open} onOpenChange={onOpenChange}>
      <OGDialogContent
        title={localize('com_ui_tags')}
        className="max-h-[80vh] w-11/12 max-w-2xl overflow-hidden bg-background text-text-primary shadow-2xl md:max-h-[70vh]"
      >
        <OGDialogHeader>
          <OGDialogTitle>{localize('com_ui_tags')}</OGDialogTitle>
        </OGDialogHeader>
        
        <div className="overflow-y-auto px-6 pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Spinner />
            </div>
          ) : !tags || tags.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
              <TagIcon className="size-12 text-text-secondary opacity-50" />
              <p className="text-text-secondary">{localize('com_endpoint_no_tags')}</p>
              <p className="text-sm text-text-tertiary">
                {localize('com_ui_tags_create_first')}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {tags.map((tag) => (
                <div
                  key={tag.tag}
                  className="group flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-surface-hover"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <TagIcon className="size-4 flex-shrink-0 text-text-secondary" />
                    <span className="truncate text-sm text-text-primary">{tag.tag}</span>
                    {tag.count != null && tag.count > 0 && (
                      <span className="text-xs text-text-tertiary">
                        ({tag.count} {localize('com_ui_tags_conversations')})
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(tag.tag)}
                    disabled={deletingTag === tag.tag}
                    className={cn(
                      'ml-2 rounded p-1.5 text-text-secondary transition-all',
                      'opacity-0 group-hover:opacity-100',
                      'hover:bg-surface-tertiary hover:text-text-primary',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                    )}
                    aria-label={`${localize('com_ui_delete')} ${tag.tag}`}
                  >
                    {deletingTag === tag.tag ? (
                      <Spinner className="size-4" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </button>
                </div>
              ))}
              <div className="mt-4 pt-4 text-center text-xs text-text-tertiary">
                {tags.length} {tags.length === 1 ? 'tag' : 'tags'}
              </div>
            </div>
          )}
        </div>
      </OGDialogContent>
    </OGDialog>
  );
}