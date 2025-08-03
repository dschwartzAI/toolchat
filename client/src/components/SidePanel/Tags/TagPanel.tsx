import { useConversationTagsQuery } from '~/data-provider';
import { TagContext } from '~/Providers/TagContext';
import TagTable from './TagTable';

const TagPanel = () => {
  const { data } = useConversationTagsQuery();

  return (
    <div className="h-auto max-w-full overflow-x-hidden">
      <TagContext.Provider value={{ tags: data || [] }}>
        <TagTable />
      </TagContext.Provider>
    </div>
  );
};
export default TagPanel;
