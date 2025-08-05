import { memo, useCallback, lazy, Suspense, useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { useForm } from 'react-hook-form';
import { useParams, useLocation } from 'react-router-dom';
import { Constants } from 'librechat-data-provider';
import type { TMessage } from 'librechat-data-provider';
import type { ChatFormValues } from '~/common';
import { ChatContext, AddedChatContext, useFileMapContext, ChatFormProvider } from '~/Providers';
import { useChatHelpers, useAddedResponse, useSSE } from '~/hooks';
import { useGetMessagesByConvoId } from '~/data-provider';
import { SimpleTour } from '~/components/Tour';
import { Spinner } from '~/components/svg';
import { buildTree, cn } from '~/utils';
import ChatForm from './Input/ChatForm';
import Header from './Header';
import Footer from './Footer';
import store from '~/store';

// Lazy load heavy components
const ConversationStarters = lazy(() => import('./Input/ConversationStarters'));
const MessagesView = lazy(() => import('./Messages/MessagesView'));
const Presentation = lazy(() => import('./Presentation'));
const Landing = lazy(() => import('./Landing'));

function LoadingSpinner() {
  return (
    <div className="relative flex-1 overflow-hidden overflow-y-auto">
      <div className="relative flex h-full items-center justify-center">
        <Spinner className="text-text-primary" />
      </div>
    </div>
  );
}

function ChatView({ index = 0 }: { index?: number }) {
  const { conversationId } = useParams();
  const location = useLocation();
  const rootSubmission = useRecoilValue(store.submissionByIndex(index));
  const addedSubmission = useRecoilValue(store.submissionByIndex(index + 1));
  const centerFormOnLanding = useRecoilValue(store.centerFormOnLanding);

  const fileMap = useFileMapContext();

  const { data: messagesTree = null, isLoading } = useGetMessagesByConvoId(conversationId ?? '', {
    select: useCallback(
      (data: TMessage[]) => {
        const dataTree = buildTree({ messages: data, fileMap });
        return dataTree?.length === 0 ? null : (dataTree ?? null);
      },
      [fileMap],
    ),
    enabled: !!fileMap,
  });

  const chatHelpers = useChatHelpers(index, conversationId);
  const addedChatHelpers = useAddedResponse({ rootIndex: index });

  useSSE(rootSubmission, chatHelpers, false);
  useSSE(addedSubmission, addedChatHelpers, true);

  const methods = useForm<ChatFormValues>({
    defaultValues: { text: '' },
  });

  // Set initial text from navigation state
  useEffect(() => {
    if (location.state?.initialText && methods) {
      methods.setValue('text', location.state.initialText);
    }
  }, [location.state?.initialText, methods]);

  let content: JSX.Element | null | undefined;
  const isLandingPage =
    (!messagesTree || messagesTree.length === 0) &&
    (conversationId === Constants.NEW_CONVO || !conversationId);
  const isNavigating = (!messagesTree || messagesTree.length === 0) && conversationId != null;

  if (isLoading && conversationId !== Constants.NEW_CONVO) {
    content = <LoadingSpinner />;
  } else if ((isLoading || isNavigating) && !isLandingPage) {
    content = <LoadingSpinner />;
  } else if (!isLandingPage) {
    content = (
      <Suspense fallback={<LoadingSpinner />}>
        <MessagesView messagesTree={messagesTree} />
      </Suspense>
    );
  } else {
    content = (
      <Suspense fallback={<LoadingSpinner />}>
        <Landing centerFormOnLanding={centerFormOnLanding} />
      </Suspense>
    );
  }

  return (
    <ChatFormProvider {...methods}>
      <ChatContext.Provider value={chatHelpers}>
        <AddedChatContext.Provider value={addedChatHelpers}>
          <SimpleTour />
          <Suspense fallback={<LoadingSpinner />}>
            <Presentation>
            <div className="flex h-full w-full flex-col">
              {!isLoading && <Header />}
              <>
                <div
                  className={cn(
                    'flex flex-col',
                    isLandingPage
                      ? 'flex-1 items-center justify-end sm:justify-center'
                      : 'h-full overflow-y-auto',
                  )}
                >
                  {content}
                  <div
                    className={cn(
                      'w-full',
                      isLandingPage && 'max-w-3xl transition-all duration-200 xl:max-w-4xl',
                    )}
                  >
                    <ChatForm index={index} />
                    {isLandingPage ? (
                      <Suspense fallback={null}>
                        <ConversationStarters />
                      </Suspense>
                    ) : (
                      <Footer />
                    )}
                  </div>
                </div>
                {isLandingPage && <Footer />}
              </>
            </div>
            </Presentation>
          </Suspense>
        </AddedChatContext.Provider>
      </ChatContext.Provider>
    </ChatFormProvider>
  );
}

export default memo(ChatView);
