import { isAssistantsEndpoint, isAgentsEndpoint } from 'librechat-data-provider';
import type {
  TConversation,
  TEndpointsConfig,
  TPreset,
  TAssistantsMap,
  TAgentsMap,
} from 'librechat-data-provider';
import ConvoIconURL from '~/components/Endpoints/ConvoIconURL';
import MinimalIcon from '~/components/Endpoints/MinimalIcon';
import { getEndpointField, getIconEndpoint } from '~/utils';

export default function EndpointIcon({
  conversation,
  endpointsConfig,
  className = 'mr-0',
  assistantMap,
  agentMap,
  context,
}: {
  conversation: TConversation | TPreset | null;
  endpointsConfig: TEndpointsConfig;
  containerClassName?: string;
  context?: 'message' | 'nav' | 'landing' | 'menu-item';
  assistantMap?: TAssistantsMap;
  agentMap?: TAgentsMap;
  className?: string;
  size?: number;
}) {
  const convoIconURL = conversation?.iconURL ?? '';
  let endpoint = conversation?.endpoint;
  endpoint = getIconEndpoint({ endpointsConfig, iconURL: convoIconURL, endpoint });

  const endpointType = getEndpointField(endpointsConfig, endpoint, 'type');
  const endpointIconURL = getEndpointField(endpointsConfig, endpoint, 'iconURL');

  const assistant = isAssistantsEndpoint(endpoint)
    ? assistantMap?.[endpoint]?.[conversation?.assistant_id ?? '']
    : null;
  const assistantAvatar = (assistant && (assistant.metadata?.avatar as string)) || '';
  const assistantName = assistant && (assistant.name ?? '');

  const agent = isAgentsEndpoint(endpoint)
    ? agentMap?.[conversation?.agent_id ?? '']
    : null;
  const agentAvatar = agent?.avatar?.filepath || '';
  const agentName = agent?.name || '';

  const iconURL = assistantAvatar || agentAvatar || convoIconURL;

  // Show a placeholder icon while data is loading for agents/assistants
  const isWaitingForData = (isAgentsEndpoint(endpoint) && conversation?.agent_id && !agent) ||
    (isAssistantsEndpoint(endpoint) && conversation?.assistant_id && !assistant);

  if (iconURL && (iconURL.includes('http') || iconURL.startsWith('/images/'))) {
    return (
      <ConvoIconURL
        iconURL={iconURL}
        modelLabel={conversation?.chatGptLabel ?? conversation?.modelLabel ?? ''}
        context={context}
        endpointIconURL={endpointIconURL}
        assistantAvatar={assistantAvatar}
        assistantName={assistantName ?? ''}
        agentAvatar={agentAvatar}
        agentName={agentName}
      />
    );
  } else {
    return (
      <MinimalIcon
        size={20}
        iconURL={endpointIconURL}
        endpoint={endpoint}
        endpointType={endpointType}
        model={conversation?.model}
        error={false}
        className={`${className} ${isWaitingForData ? 'opacity-60' : ''}`}
        isCreatedByUser={false}
        chatGptLabel={undefined}
        modelLabel={undefined}
      />
    );
  }
}
