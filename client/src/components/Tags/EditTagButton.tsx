import { useState } from 'react';
import type { FC } from 'react';
import type { TConversationTag } from 'librechat-data-provider';
import { TooltipAnchor, OGDialogTrigger, EditIcon, Button } from '~/components';
import TagEditDialog from './TagEditDialog';
import { useLocalize } from '~/hooks';

const EditTagButton: FC<{
  tag: TConversationTag;
  tabIndex?: number;
  onFocus?: () => void;
  onBlur?: () => void;
}> = ({ tag, tabIndex = 0, onFocus, onBlur }) => {
  const localize = useLocalize();
  const [open, setOpen] = useState(false);

  return (
    <TagEditDialog
      context="EditTagButton"
      tag={tag}
      open={open}
      setOpen={setOpen}
    >
      <OGDialogTrigger asChild>
        <TooltipAnchor
          description={localize('com_ui_edit')}
          render={
            <Button
              variant="ghost"
              aria-label={localize('com_ui_tags_edit')}
              tabIndex={tabIndex}
              onFocus={onFocus}
              onBlur={onBlur}
              onClick={() => setOpen(!open)}
              className="h-8 w-8 p-0"
            >
              <EditIcon />
            </Button>
          }
        />
      </OGDialogTrigger>
    </TagEditDialog>
  );
};

export default EditTagButton;
