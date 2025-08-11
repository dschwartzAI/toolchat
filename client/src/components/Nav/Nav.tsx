import { useCallback, useEffect, useState, useMemo, memo, lazy, Suspense, useRef } from 'react';
import { useRecoilValue } from 'recoil';
import { PermissionTypes, Permissions } from 'librechat-data-provider';
import type { ConversationListResponse } from 'librechat-data-provider';
import type { InfiniteQueryObserverResult } from '@tanstack/react-query';
import {
  useLocalize,
  useHasAccess,
  useMediaQuery,
  useAuthContext,
  useLocalStorage,
  useNavScrolling,
  useAgentsMap,
  useAssistantsMap,
} from '~/hooks';
import { useConversationsInfiniteQuery } from '~/data-provider';
import { Conversations } from '~/components/Conversations';
import SearchBar from './SearchBar';
import NewChat from './NewChat';
import { Logo } from '~/components/ui';
import { GraduationCap, MessagesSquared } from '~/components/svg';
import { cn } from '~/utils';
import store from '~/store';
const TagNav = lazy(() => import('./Tags/TagNav'));
const AccountSettings = lazy(() => import('./AccountSettings'));
const MessagesInbox = lazy(() => import('../Messages/MessagesInbox'));

const NAV_WIDTH_DESKTOP = '260px';
const NAV_WIDTH_MOBILE = '320px';

const NavMask = memo(
  ({ navVisible, toggleNavVisible }: { navVisible: boolean; toggleNavVisible: () => void }) => (
    <div
      id="mobile-nav-mask-toggle"
      role="button"
      tabIndex={0}
      className={`nav-mask transition-opacity duration-200 ease-in-out ${navVisible ? 'active opacity-100' : 'opacity-0'}`}
      onClick={toggleNavVisible}
      onTouchEnd={toggleNavVisible}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          toggleNavVisible();
        }
      }}
      aria-label="Toggle navigation"
      aria-hidden={!navVisible}
    />
  ),
);

const MemoNewChat = memo(NewChat);

const Nav = memo(
  ({
    navVisible,
    setNavVisible,
    academyVisible,
    setAcademyVisible,
  }: {
    navVisible: boolean;
    setNavVisible: React.Dispatch<React.SetStateAction<boolean>>;
    academyVisible?: boolean;
    setAcademyVisible?: React.Dispatch<React.SetStateAction<boolean>>;
  }) => {
    const localize = useLocalize();
    const { isAuthenticated } = useAuthContext();

    const [navWidth, setNavWidth] = useState(NAV_WIDTH_DESKTOP);
    const isSmallScreen = useMediaQuery('(max-width: 768px)');
    const [newUser, setNewUser] = useLocalStorage('newUser', true);
    const [showLoading, setShowLoading] = useState(false);
    const [tags, setTags] = useState<string[]>([]);
    const [messagesOpen, setMessagesOpen] = useState(false);

    const hasAccessToBookmarks = useHasAccess({
      permissionType: PermissionTypes.BOOKMARKS,
      permission: Permissions.USE,
    });

    const hasAccessToMultiConvo = useHasAccess({
      permissionType: PermissionTypes.MULTI_CONVO,
      permission: Permissions.USE,
    });

    const search = useRecoilValue(store.search);
    
    // Fetch agent and assistant data for avatar display
    const agentMap = useAgentsMap({ isAuthenticated });
    const assistantMap = useAssistantsMap({ isAuthenticated });
    
    // Track if initial data is loaded
    const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);

    const { data, fetchNextPage, isFetchingNextPage, isLoading, isFetching, refetch } =
      useConversationsInfiniteQuery(
        {
          tags: tags.length === 0 ? undefined : tags,
          search: search.debouncedQuery || undefined,
        },
        {
          enabled: isAuthenticated,
          staleTime: 30000,
          cacheTime: 300000,
        },
      );

    const computedHasNextPage = useMemo(() => {
      if (data?.pages && data.pages.length > 0) {
        const lastPage: ConversationListResponse = data.pages[data.pages.length - 1];
        return lastPage.nextCursor !== null;
      }
      return false;
    }, [data?.pages]);

    const outerContainerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<any>(null);

    const { moveToTop } = useNavScrolling<ConversationListResponse>({
      setShowLoading,
      fetchNextPage: async (options?) => {
        if (computedHasNextPage) {
          return fetchNextPage(options);
        }
        return Promise.resolve(
          {} as InfiniteQueryObserverResult<ConversationListResponse, unknown>,
        );
      },
      isFetchingNext: isFetchingNextPage,
    });

    const conversations = useMemo(() => {
      return data ? data.pages.flatMap((page) => page.conversations) : [];
    }, [data]);

    const toggleNavVisible = useCallback(() => {
      setNavVisible((prev: boolean) => {
        localStorage.setItem('navVisible', JSON.stringify(!prev));
        return !prev;
      });
      if (newUser) {
        setNewUser(false);
      }
    }, [newUser, setNavVisible, setNewUser]);

    const itemToggleNav = useCallback(() => {
      if (isSmallScreen) {
        toggleNavVisible();
      }
    }, [isSmallScreen, toggleNavVisible]);

    useEffect(() => {
      if (isSmallScreen) {
        const savedNavVisible = localStorage.getItem('navVisible');
        if (savedNavVisible === null) {
          toggleNavVisible();
        }
        setNavWidth(NAV_WIDTH_MOBILE);
      } else {
        setNavWidth(NAV_WIDTH_DESKTOP);
      }
    }, [isSmallScreen, toggleNavVisible]);

    useEffect(() => {
      refetch();
    }, [tags, refetch]);
    
    // Set initial data loaded when agent/assistant maps are available
    useEffect(() => {
      if (isAuthenticated && (agentMap !== undefined || assistantMap !== undefined)) {
        setIsInitialDataLoaded(true);
      }
    }, [isAuthenticated, agentMap, assistantMap]);

    const loadMoreConversations = useCallback(() => {
      if (isFetchingNextPage || !computedHasNextPage) {
        return;
      }

      fetchNextPage();
    }, [isFetchingNextPage, computedHasNextPage, fetchNextPage]);

    const subHeaders = useMemo(
      () => search.enabled === true && <SearchBar isSmallScreen={isSmallScreen} />,
      [search.enabled, isSmallScreen],
    );

    const headerButtons = useMemo(
      () =>
        hasAccessToBookmarks && (
          <>
            <div className="mt-1.5" />
            <Suspense fallback={null}>
              <TagNav tags={tags} setTags={setTags} isSmallScreen={isSmallScreen} />
            </Suspense>
          </>
        ),
      [hasAccessToBookmarks, tags, isSmallScreen],
    );

    const [isSearchLoading, setIsSearchLoading] = useState(
      !!search.query && (search.isTyping || isLoading || isFetching),
    );


    useEffect(() => {
      if (search.isTyping) {
        setIsSearchLoading(true);
      } else if (!isLoading && !isFetching) {
        setIsSearchLoading(false);
      } else if (!!search.query && (isLoading || isFetching)) {
        setIsSearchLoading(true);
      }
    }, [search.query, search.isTyping, isLoading, isFetching]);

    return (
      <>
        <div
          data-testid="nav"
          className={cn(
            'nav active max-w-[320px] flex-shrink-0 transform overflow-x-hidden bg-surface-primary-alt transition-all duration-200 ease-in-out',
            'md:max-w-[260px]',
          )}
          style={{
            width: navVisible ? navWidth : '0px',
            transform: navVisible ? 'translateX(0)' : 'translateX(-100%)',
          }}
        >
          <div className="h-full w-[320px] md:w-[260px]">
            <div className="flex h-full flex-col">
              <div
                className={`flex h-full flex-col transition-opacity duration-200 ease-in-out ${navVisible ? 'opacity-100' : 'opacity-0'}`}
              >
                <div className="flex h-full flex-col">
                  <nav
                    id="chat-history-nav"
                    aria-label={localize('com_ui_chat_history')}
                    className="flex h-full flex-col px-2 pb-3.5 md:px-3"
                  >
                    <div className="flex flex-1 flex-col" ref={outerContainerRef}>
                      <div className="px-2 py-3 flex justify-center">
                        <Logo size="medium" showText={false} />
                      </div>
                      <MemoNewChat
                        subHeaders={subHeaders}
                        toggleNav={toggleNavVisible}
                        headerButtons={headerButtons}
                        isSmallScreen={isSmallScreen}
                      />
                      {setAcademyVisible && (
                        <>
                          <div className="px-2 mb-1">
                            <button
                              onClick={() => setAcademyVisible(!academyVisible)}
                              className={cn(
                                'group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                                'border',
                                academyVisible 
                                  ? 'bg-green-500/15 text-green-600 border-green-500/30' 
                                  : 'bg-surface-secondary/50 border-border-medium hover:bg-surface-secondary hover:border-border-light text-text-secondary hover:text-text-primary'
                              )}
                              aria-label={localize('com_academy_title')}
                            >
                              <GraduationCap className="h-4 w-4" />
                              <span>{localize('com_academy_title') || 'Academy'}</span>
                            </button>
                          </div>
                          <div className="px-2 mb-1">
                            <button
                              onClick={() => setMessagesOpen(!messagesOpen)}
                              className={cn(
                                'group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                                'border',
                                messagesOpen
                                  ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400'
                                  : 'bg-surface-secondary/50 border-border-medium hover:bg-surface-secondary hover:border-border-light text-text-secondary hover:text-text-primary'
                              )}
                              aria-label="Messages"
                              aria-pressed={messagesOpen}
                            >
                              <MessagesSquared className={cn('h-4 w-4', messagesOpen && 'text-green-600 dark:text-green-400')} />
                              <span>Messages</span>
                            </button>
                          </div>
                        </>
                      )}
                      <Conversations
                        conversations={conversations}
                        moveToTop={moveToTop}
                        toggleNav={itemToggleNav}
                        containerRef={listRef}
                        loadMoreConversations={loadMoreConversations}
                        isLoading={isFetchingNextPage || showLoading || isLoading}
                        isSearchLoading={isSearchLoading}
                        agentMap={agentMap}
                        assistantMap={assistantMap}
                      />
                    </div>
                    <Suspense fallback={null}>
                      <AccountSettings />
                    </Suspense>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
        {isSmallScreen && <NavMask navVisible={navVisible} toggleNavVisible={toggleNavVisible} />}
        <Suspense fallback={null}>
          <MessagesInbox isOpen={messagesOpen} onClose={() => setMessagesOpen(false)} />
        </Suspense>
      </>
    );
  },
);

Nav.displayName = 'Nav';

export default Nav;
