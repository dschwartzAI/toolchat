import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGetModelsQuery } from 'librechat-data-provider/react-query';
import {
  Constants,
  FileSources,
  EModelEndpoint,
  isParamEndpoint,
  LocalStorageKeys,
  isAssistantsEndpoint,
  isAgentsEndpoint,
} from 'librechat-data-provider';
import { useRecoilState, useRecoilValue, useSetRecoilState, useRecoilCallback } from 'recoil';
import type {
  TPreset,
  TSubmission,
  TModelsConfig,
  TConversation,
  TEndpointsConfig,
} from 'librechat-data-provider';
import type { AssistantListItem } from '~/common';
import {
  getEndpointField,
  buildDefaultConvo,
  getDefaultEndpoint,
  getModelSpecPreset,
  getDefaultModelSpec,
  updateLastSelectedModel,
} from '~/utils';
import { useDeleteFilesMutation, useGetEndpointsQuery, useGetStartupConfig } from '~/data-provider';
import useAssistantListMap from './Assistants/useAssistantListMap';
import { useResetChatBadges } from './useChatBadges';
import { usePauseGlobalAudio } from './Audio';
import { logger } from '~/utils';
import store from '~/store';

const useNewConvo = (index = 0) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: startupConfig } = useGetStartupConfig();
  const clearAllConversations = store.useClearConvoState();
  const defaultPreset = useRecoilValue(store.defaultPreset);
  const { setConversation } = store.useCreateConversationAtom(index);
  const [files, setFiles] = useRecoilState(store.filesByIndex(index));
  const saveBadgesState = useRecoilValue<boolean>(store.saveBadgesState);
  const clearAllLatestMessages = store.useClearLatestMessages(`useNewConvo ${index}`);
  const setSubmission = useSetRecoilState<TSubmission | null>(store.submissionByIndex(index));
  const { data: endpointsConfig = {} as TEndpointsConfig } = useGetEndpointsQuery();

  const modelsQuery = useGetModelsQuery();
  const assistantsListMap = useAssistantListMap();
  const { pauseGlobalAudio } = usePauseGlobalAudio(index);
  const saveDrafts = useRecoilValue<boolean>(store.saveDrafts);
  const resetBadges = useResetChatBadges();

  const { mutateAsync } = useDeleteFilesMutation({
    onSuccess: () => {
      // Files deleted successfully
    },
    onError: (error) => {
      // Error deleting files
    },
  });

  const switchToConversation = useRecoilCallback(
    () =>
      async (
        conversation: TConversation,
        preset: Partial<TPreset> | null = null,
        modelsData?: TModelsConfig,
        buildDefault?: boolean,
        keepLatestMessage?: boolean,
        keepAddedConvos?: boolean,
        disableFocus?: boolean,
        _disableParams?: boolean,
      ) => {
        const modelsConfig = modelsData ?? modelsQuery.data;
        const { endpoint = null } = conversation;
        const buildDefaultConversation = (endpoint === null || buildDefault) ?? false;
        const activePreset =
          // use default preset only when it's defined,
          // preset is not provided,
          // endpoint matches or is null (to allow endpoint change),
          // and buildDefaultConversation is true
          defaultPreset &&
          !preset &&
          (defaultPreset.endpoint === endpoint || !endpoint) &&
          buildDefaultConversation
            ? defaultPreset
            : preset;

        const disableParams =
          _disableParams ??
          (activePreset?.presetId != null &&
            activePreset.presetId &&
            activePreset.presetId === defaultPreset?.presetId);

        if (buildDefaultConversation) {
          let defaultEndpoint = getDefaultEndpoint({
            convoSetup: activePreset ?? conversation,
            endpointsConfig,
            startupConfig,
          });

          if (!defaultEndpoint) {
            defaultEndpoint = Object.keys(endpointsConfig ?? {})[0] as EModelEndpoint;
          }

          const endpointType = getEndpointField(endpointsConfig, defaultEndpoint, 'type');
          if (!conversation.endpointType && endpointType) {
            conversation.endpointType = endpointType;
          } else if (conversation.endpointType && !endpointType) {
            conversation.endpointType = undefined;
          }

          const isAssistantEndpoint = isAssistantsEndpoint(defaultEndpoint);
          const assistants: AssistantListItem[] = assistantsListMap[defaultEndpoint] ?? [];
          const currentAssistantId = conversation.assistant_id ?? '';
          const currentAssistant = assistantsListMap[defaultEndpoint]?.[currentAssistantId] as
            | AssistantListItem
            | undefined;

          if (currentAssistantId && !currentAssistant) {
            conversation.assistant_id = undefined;
          }

          if (!currentAssistantId && isAssistantEndpoint) {
            // Try to get SovereignJK specifically or fall back to stored/first assistant
            const sovereignJK = assistants.find((asst) => 
              asst.name?.toLowerCase().includes('sovereignjk') || 
              asst.name?.toLowerCase().includes('sovereign jk')
            );
            conversation.assistant_id =
              sovereignJK?.id ??
              localStorage.getItem(
                `${LocalStorageKeys.ASST_ID_PREFIX}${index}${defaultEndpoint}`,
              ) ?? assistants[0]?.id;
          }


          if (
            currentAssistantId &&
            isAssistantEndpoint &&
            conversation.conversationId === Constants.NEW_CONVO
          ) {
            const assistant = assistants.find((asst) => asst.id === currentAssistantId);
            conversation.model = assistant?.model;
            updateLastSelectedModel({
              endpoint: defaultEndpoint,
              model: conversation.model,
            });
          }

          if (currentAssistantId && !isAssistantEndpoint) {
            conversation.assistant_id = undefined;
          }

          // Handle agents endpoint
          const isAgentEndpoint = isAgentsEndpoint(defaultEndpoint);
          const currentAgentId = conversation.agent_id ?? '';
          
          if (currentAgentId && !isAgentEndpoint) {
            conversation.agent_id = undefined;
          }
          
          // Use defaultAgent from config if no agent is selected
          if (isAgentEndpoint && !currentAgentId && startupConfig?.interface?.defaultAgent) {
            conversation.agent_id = startupConfig.interface.defaultAgent;
            // Using defaultAgent from config
          }
          
          // Preserve agent_id when switching to agents endpoint
          if (isAgentEndpoint && activePreset?.agent_id) {
            conversation.agent_id = activePreset.agent_id;
            // Preserving agent_id from preset
          }

          const models = modelsConfig?.[defaultEndpoint] ?? [];
          conversation = buildDefaultConvo({
            conversation,
            lastConversationSetup: activePreset as TConversation,
            endpoint: defaultEndpoint,
            models,
          });
        }

        if (disableParams === true) {
          conversation.disableParams = true;
        }

        if (!(keepAddedConvos ?? false)) {
          clearAllConversations(true);
        }
        const isCancelled = conversation.conversationId?.startsWith('_');
        if (isCancelled) {
          logger.log(
            'conversation',
            'Cancelled conversation, setting to `new` in `useNewConvo`',
            conversation,
          );
          setConversation({
            ...conversation,
            conversationId: Constants.NEW_CONVO as string,
          });
        } else {
          logger.log('conversation', 'Setting conversation from `useNewConvo`', conversation);
          // Setting final conversation
          setConversation(conversation);
        }
        setSubmission({} as TSubmission);
        if (!(keepLatestMessage ?? false)) {
          clearAllLatestMessages();
        }
        if (isCancelled) {
          return;
        }

        const searchParamsString = searchParams?.toString();
        const getParams = () => (searchParamsString ? `?${searchParamsString}` : '');

        if (conversation.conversationId === Constants.NEW_CONVO && !modelsData) {
          const appTitle = localStorage.getItem(LocalStorageKeys.APP_TITLE) ?? '';
          if (appTitle) {
            document.title = appTitle;
          }
          const path = `/c/${Constants.NEW_CONVO}${getParams()}`;
          navigate(path, { state: { focusChat: true } });
          return;
        }

        const path = `/c/${conversation.conversationId}${getParams()}`;
        navigate(path, {
          replace: true,
          state: disableFocus ? {} : { focusChat: true },
        });
      },
    [endpointsConfig, defaultPreset, assistantsListMap, modelsQuery.data],
  );

  const newConversation = useCallback(
    function createNewConvo({
      template: _template = {},
      preset: _preset,
      modelsData,
      disableFocus,
      buildDefault = true,
      keepLatestMessage = false,
      keepAddedConvos = false,
      disableParams,
    }: {
      template?: Partial<TConversation>;
      preset?: Partial<TPreset>;
      modelsData?: TModelsConfig;
      buildDefault?: boolean;
      disableFocus?: boolean;
      keepLatestMessage?: boolean;
      keepAddedConvos?: boolean;
      disableParams?: boolean;
    } = {}) {
      pauseGlobalAudio();
      if (!saveBadgesState) {
        resetBadges();
      }

      const templateConvoId = _template.conversationId ?? '';
      const paramEndpoint =
        isParamEndpoint(_template.endpoint ?? '', _template.endpointType ?? '') === true ||
        isParamEndpoint(_preset?.endpoint ?? '', _preset?.endpointType ?? '');
      const template =
        paramEndpoint === true && templateConvoId && templateConvoId === Constants.NEW_CONVO
          ? { 
              endpoint: _template.endpoint,
              ...(isAgentsEndpoint(_template.endpoint) && _template.agent_id ? { agent_id: _template.agent_id } : {}),
              ...(isAssistantsEndpoint(_template.endpoint) && _template.assistant_id ? { assistant_id: _template.assistant_id } : {})
            }
          : _template;

      const conversation = {
        conversationId: Constants.NEW_CONVO as string,
        title: 'New Chat',
        endpoint: null,
        ...template,
        createdAt: '',
        updatedAt: '',
      };
      
      // Creating new conversation

      let preset = _preset;
      const defaultModelSpec = getDefaultModelSpec(startupConfig);
      if (
        !preset &&
        startupConfig &&
        (startupConfig.modelSpecs?.prioritize === true ||
          (startupConfig.interface?.modelSelect ?? true) !== true) &&
        defaultModelSpec
      ) {
        preset = getModelSpecPreset(defaultModelSpec);
      }

      if (conversation.conversationId === 'new' && !modelsData) {
        const filesToDelete = Array.from(files.values())
          .filter(
            (file) =>
              file.filepath != null &&
              file.filepath !== '' &&
              file.source &&
              !(file.embedded ?? false) &&
              file.temp_file_id,
          )
          .map((file) => ({
            file_id: file.file_id,
            embedded: !!(file.embedded ?? false),
            filepath: file.filepath as string,
            source: file.source as FileSources, // Ensure that the source is of type FileSources
          }));

        setFiles(new Map());
        localStorage.setItem(LocalStorageKeys.FILES_TO_DELETE, JSON.stringify({}));

        if (!saveDrafts && filesToDelete.length > 0) {
          mutateAsync({ files: filesToDelete });
        }
      }

      switchToConversation(
        conversation,
        preset,
        modelsData,
        buildDefault,
        keepLatestMessage,
        keepAddedConvos,
        disableFocus,
        disableParams,
      );
    },
    [
      files,
      setFiles,
      saveDrafts,
      mutateAsync,
      resetBadges,
      startupConfig,
      saveBadgesState,
      pauseGlobalAudio,
      switchToConversation,
    ],
  );

  return {
    switchToConversation,
    newConversation,
  };
};

export default useNewConvo;
