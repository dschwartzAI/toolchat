import { useCallback, useState } from 'react';
import type { FC } from 'react';
import { Button, TrashIcon, Label, OGDialog, OGDialogTrigger, TooltipAnchor } from '~/components';
import { useDeleteConversationTagMutation } from '~/data-provider';
import OGDialogTemplate from '~/components/ui/OGDialogTemplate';
import { NotificationSeverity } from '~/common';
import { useToastContext } from '~/Providers';
import { useLocalize } from '~/hooks';

const DeleteTagButton: FC<{
  tag: string;
  tabIndex?: number;
  onFocus?: () => void;
  onBlur?: () => void;
}> = ({ tag, tabIndex = 0, onFocus, onBlur }) => {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const [open, setOpen] = useState(false);

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

  const confirmDelete = useCallback(async () => {
    await deleteTagMutation.mutateAsync(tag);
  }, [tag, deleteTagMutation]);

  return (
    <>
      <OGDialog open={open} onOpenChange={setOpen}>
        <OGDialogTrigger asChild>
          <TooltipAnchor
            description={localize('com_ui_delete')}
            render={
              <Button
                variant="ghost"
                aria-label={localize('com_ui_tags_delete')}
                tabIndex={tabIndex}
                onFocus={onFocus}
                onBlur={onBlur}
                onClick={() => setOpen(!open)}
                className="h-8 w-8 p-0"
              >
                <TrashIcon />
              </Button>
            }
          />
        </OGDialogTrigger>
        <OGDialogTemplate
          showCloseButton={false}
          title={localize('com_ui_tags_delete')}
          className="w-11/12 max-w-lg"
          main={
            <Label className="text-left text-sm font-medium">
              {localize('com_ui_tag_delete_confirm')} {tag}
            </Label>
          }
          selection={{
            selectHandler: confirmDelete,
            selectClasses:
              'bg-red-700 dark:bg-red-600 hover:bg-red-800 dark:hover:bg-red-800 text-white',
            selectText: localize('com_ui_delete'),
          }}
        />
      </OGDialog>
    </>
  );
};

export default DeleteTagButton;
