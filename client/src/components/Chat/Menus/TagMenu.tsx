import { useState, useId, useCallback, useMemo, useRef } from 'react';
import { useRecoilValue } from 'recoil';
import * as Ariakit from '@ariakit/react';
import { TagIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Constants, QueryKeys } from 'librechat-data-provider';
import { BookmarkFilledIcon as TagFilledIcon, BookmarkIcon as TagIcon2 } from '@radix-ui/react-icons';
import type { TConversationTag } from 'librechat-data-provider';
import type { FC } from 'react';
import type * as t from '~/common';
import { useConversationTagsQuery, useTagConversationMutation } from '~/data-provider';
import { DropdownPopup, TooltipAnchor } from '~/components/ui';
import { TagContext } from '~/Providers/TagContext';
import { TagEditDialog } from '~/components/Tags';
import { useTagSuccess, useLocalize } from '~/hooks';
import { NotificationSeverity } from '~/common';
import { useToastContext } from '~/Providers';
import { Spinner } from '~/components';
import { cn, logger } from '~/utils';
import store from '~/store';

const TagMenu: FC = () => {
  const localize = useLocalize();
  const queryClient = useQueryClient();
  const { showToast } = useToastContext();

  const conversation = useRecoilValue(store.conversationByIndex(0)) || undefined;
  const conversationId = conversation?.conversationId ?? '';
  const updateConvoTags = useTagSuccess(conversationId);
  const tags = conversation?.tags;
  const isTemporary = conversation?.expiredAt != null;

  const menuId = useId();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const mutation = useTagConversationMutation(conversationId, {
    onSuccess: (newTags: string[], vars) => {
      updateConvoTags(newTags);
      const tagElement = document.getElementById(vars.tag);
      if (tagElement) {
        setTimeout(() => tagElement.focus(), 2);
      }
    },
    onError: () => {
      showToast({
        message: 'Error adding tag',
        severity: NotificationSeverity.ERROR,
      });
    },
    onMutate: (vars) => {
      const tagElement = document.getElementById(vars.tag);
      if (tagElement) {
        setTimeout(() => tagElement.focus(), 2);
      }
    },
  });

  const { data } = useConversationTagsQuery();

  const isActiveConvo = Boolean(
    conversation &&
      conversationId &&
      conversationId !== Constants.NEW_CONVO &&
      conversationId !== 'search',
  );

  const handleSubmit = useCallback(
    (tag?: string) => {
      if (tag === undefined || tag === '' || !conversationId) {
        showToast({
          message: 'Invalid tag or conversationId',
          severity: NotificationSeverity.ERROR,
        });
        return;
      }

      logger.log('tag_mutation', 'TagMenu - handleSubmit: tags before setting', tags);

      const allTags =
        queryClient.getQueryData<TConversationTag[]>([QueryKeys.conversationTags]) ?? [];
      const existingTags = allTags.map((t) => t.tag);
      const filteredTags = tags?.filter((t) => existingTags.includes(t));

      logger.log('tag_mutation', 'TagMenu - handleSubmit: tags after filtering', filteredTags);
      const newTags =
        filteredTags?.includes(tag) === true
          ? filteredTags.filter((t) => t !== tag)
          : [...(filteredTags ?? []), tag];

      logger.log('tag_mutation', 'TagMenu - handleSubmit: tags after', newTags);
      mutation.mutate({
        tags: newTags,
        tag,
      });
    },
    [tags, conversationId, mutation, queryClient, showToast],
  );

  const newTagRef = useRef<HTMLButtonElement>(null);

  const dropdownItems: t.MenuItemProps[] = useMemo(() => {
    const items: t.MenuItemProps[] = [
      {
        id: '%___new___tag___%',
        label: localize('com_ui_tags_new'),
        icon: <TagIcon className="size-4" />,
        hideOnClick: false,
        ref: newTagRef,
        render: (props) => <button {...props} />,
        onClick: () => setIsDialogOpen(true),
      },
    ];

    if (data) {
      for (const tag of data) {
        const isSelected = tags?.includes(tag.tag);
        items.push({
          id: tag.tag,
          label: tag.tag,
          hideOnClick: false,
          icon:
            isSelected === true ? (
              <TagFilledIcon className="size-4" />
            ) : (
              <TagIcon2 className="size-4" />
            ),
          onClick: () => handleSubmit(tag.tag),
          disabled: mutation.isLoading,
        });
      }
    }

    return items;
  }, [tags, data, handleSubmit, mutation.isLoading, localize]);

  if (!isActiveConvo) {
    return null;
  }

  if (isTemporary) {
    return null;
  }

  const renderButtonContent = () => {
    if (mutation.isLoading) {
      return <Spinner aria-label="Spinner" />;
    }
    if ((tags?.length ?? 0) > 0) {
      return <TagFilledIcon className="icon-sm" aria-label="Filled Tag" />;
    }
    return <TagIcon2 className="icon-sm" aria-label="Tag" />;
  };

  return (
    <TagContext.Provider value={{ tags: data || [] }}>
      <div data-tour="tag-menu">
      <DropdownPopup
        portal={true}
        menuId={menuId}
        focusLoop={true}
        isOpen={isMenuOpen}
        unmountOnHide={true}
        setIsOpen={setIsMenuOpen}
        keyPrefix={`${conversationId}-tag-`}
        trigger={
          <TooltipAnchor
            description={localize('com_ui_tags_add')}
            render={
              <Ariakit.MenuButton
                id="tag-menu-button"
                aria-label={localize('com_ui_tags_add')}
                className={cn(
                  'mt-text-sm flex size-10 flex-shrink-0 items-center justify-center gap-2 rounded-xl border border-border-light text-sm transition-colors duration-200 hover:bg-surface-hover',
                  isMenuOpen ? 'bg-surface-hover' : '',
                )}
                data-testid="tag-menu"
              >
                {renderButtonContent()}
              </Ariakit.MenuButton>
            }
          />
        }
        items={dropdownItems}
      />
      <TagEditDialog
        tags={tags}
        open={isDialogOpen}
        setTags={updateConvoTags}
        setOpen={setIsDialogOpen}
        triggerRef={newTagRef}
        conversationId={conversationId}
        context="TagMenu - TagEditDialog"
      />
      </div>
    </TagContext.Provider>
  );
};

export default TagMenu;
