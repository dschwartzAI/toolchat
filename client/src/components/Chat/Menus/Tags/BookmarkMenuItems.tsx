import React, { useState } from 'react';
import { TagIcon } from 'lucide-react';
import type { FC } from 'react';
import { TagEditDialog, TagItems, TagItem } from '~/components/Tags';
import { OGDialogTrigger } from '~/components/ui';
import { useLocalize } from '~/hooks';

export const TagMenuItems: FC<{
  tags: string[];
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
  handleSubmit: (tag?: string) => void;
  conversationId?: string;
}> = ({ tags, setTags, handleSubmit, conversationId }) => {
  const localize = useLocalize();
  const [open, setOpen] = useState(false);
  const handleToggleOpen = () => setOpen(!open);

  return (
    <TagItems
      tags={tags}
      handleSubmit={handleSubmit}
      header={
        <TagEditDialog
          context="TagMenu - TagEditDialog"
          conversationId={conversationId}
          tags={tags}
          setTags={setTags}
          open={open}
          setOpen={setOpen}
        >
          <OGDialogTrigger asChild>
            <TagItem
              tag={localize('com_ui_tags_new')}
              data-testid="tag-item-new"
              handleSubmit={handleToggleOpen}
              selected={false}
              icon={<TagIcon className="size-4" aria-label="Add Tag" />}
            />
          </OGDialogTrigger>
        </TagEditDialog>
      }
    />
  );
};
