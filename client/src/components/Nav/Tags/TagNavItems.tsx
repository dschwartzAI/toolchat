import { useEffect, useState, type FC } from 'react';
import { CrossCircledIcon } from '@radix-ui/react-icons';
import type { TConversation } from 'librechat-data-provider';
import { useTagContext } from '~/Providers/TagContext';
import { TagItems, TagItem } from '~/components/Tags';
import { useLocalize } from '~/hooks';

const TagNavItems: FC<{
  conversation: TConversation;
  tags: string[];
  setTags: (tags: string[]) => void;
}> = ({ conversation, tags = [], setTags }) => {
  const [currentConversation, setCurrentConversation] = useState<TConversation>();
  const { tags: allTags } = useTagContext();
  const localize = useLocalize();

  useEffect(() => {
    if (!currentConversation) {
      setCurrentConversation(conversation);
    }
  }, [conversation, currentConversation]);

  const getUpdatedSelected = (tag: string) => {
    if (tags.some((selectedTag) => selectedTag === tag)) {
      return tags.filter((selectedTag) => selectedTag !== tag);
    } else {
      return [...tags, tag];
    }
  };

  const handleSubmit = (tag?: string) => {
    if (tag === undefined) {
      return;
    }
    const updatedSelected = getUpdatedSelected(tag);
    setTags(updatedSelected);
    return;
  };

  const clear = () => {
    setTags([]);
    return;
  };

  if (allTags.length === 0) {
    return (
      <div className="flex flex-col">
        <TagItem
          tag={localize('com_ui_clear_all')}
          data-testid="tag-item-clear"
          handleSubmit={clear}
          selected={false}
          icon={<CrossCircledIcon className="size-4" />}
        />
        <TagItem
          tag={localize('com_ui_no_tags')}
          data-testid="tag-item-no-tags"
          handleSubmit={() => Promise.resolve()}
          selected={false}
          icon={'🤔'}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <TagItems
        tags={tags}
        handleSubmit={handleSubmit}
        header={
          <TagItem
            tag={localize('com_ui_clear_all')}
            data-testid="tag-item-clear"
            handleSubmit={clear}
            selected={false}
            icon={<CrossCircledIcon className="size-4" />}
          />
        }
      />
    </div>
  );
};

export default TagNavItems;
