import type { FC } from 'react';
import { useTagContext } from '~/Providers/TagContext';
import TagItem from './TagItem';
interface TagItemsProps {
  tags: string[];
  handleSubmit: (tag?: string) => void;
  header: React.ReactNode;
}

const TagItems: FC<TagItemsProps> = ({ tags, handleSubmit, header }) => {
  const { tags: allTags } = useTagContext();

  return (
    <>
      {header}
      {allTags.length > 0 && <div className="my-1.5 h-px" role="none" />}
      {allTags.map((tag, i) => (
        <TagItem
          key={`${tag._id ?? tag.tag}-${i}`}
          tag={tag.tag}
          selected={tags.includes(tag.tag)}
          handleSubmit={handleSubmit}
        />
      ))}
    </>
  );
};

export default TagItems;
