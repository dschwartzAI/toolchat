import { createContext, useContext } from 'react';
import type { TConversationTag } from 'librechat-data-provider';

type TTagContext = { tags: TConversationTag[] };

export const TagContext = createContext<TTagContext>({
  tags: [],
} as TTagContext);
export const useTagContext = () => useContext(TagContext);
