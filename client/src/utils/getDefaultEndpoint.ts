import type {
  TPreset,
  TConversation,
  EModelEndpoint,
  TEndpointsConfig,
  TStartupConfig,
} from 'librechat-data-provider';
import { getLocalStorageItems } from './localStorage';
import { mapEndpoints } from './endpoints';

type TConvoSetup = Partial<TPreset> | Partial<TConversation>;

type TDefaultEndpoint = { 
  convoSetup: TConvoSetup; 
  endpointsConfig: TEndpointsConfig;
  startupConfig?: TStartupConfig | null;
};

const getEndpointFromSetup = (
  convoSetup: TConvoSetup | null,
  endpointsConfig: TEndpointsConfig,
): EModelEndpoint | null => {
  let { endpoint: targetEndpoint = '' } = convoSetup || {};
  targetEndpoint = targetEndpoint ?? '';
  if (targetEndpoint && endpointsConfig?.[targetEndpoint]) {
    return targetEndpoint as EModelEndpoint;
  } else if (targetEndpoint) {
    console.warn(`Illegal target endpoint ${targetEndpoint}`, endpointsConfig);
  }
  return null;
};

const getEndpointFromLocalStorage = (endpointsConfig: TEndpointsConfig) => {
  try {
    const { lastConversationSetup } = getLocalStorageItems();
    const { endpoint } = lastConversationSetup ?? { endpoint: null };
    const isDefaultConfig = Object.values(endpointsConfig ?? {}).every((value) => !value);

    if (isDefaultConfig && endpoint) {
      return endpoint;
    }

    if (isDefaultConfig && endpoint) {
      return endpoint;
    }

    return endpoint && endpointsConfig?.[endpoint] != null ? endpoint : null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const getDefinedEndpoint = (endpointsConfig: TEndpointsConfig) => {
  const endpoints = mapEndpoints(endpointsConfig);
  return endpoints.find((e) => Object.hasOwn(endpointsConfig ?? {}, e));
};

const getDefaultEndpoint = ({
  convoSetup,
  endpointsConfig,
  startupConfig,
}: TDefaultEndpoint): EModelEndpoint | undefined => {
  // First check if we have an explicit endpoint from the conversation setup
  const fromSetup = getEndpointFromSetup(convoSetup, endpointsConfig);
  if (fromSetup) {
    return fromSetup;
  }
  
  // Check if there's a configured defaultEndpoint
  const configuredDefault = startupConfig?.interface?.defaultEndpoint;
  if (configuredDefault && endpointsConfig?.[configuredDefault]) {
    return configuredDefault as EModelEndpoint;
  }
  
  // Then check localStorage for user's last selection
  const fromStorage = getEndpointFromLocalStorage(endpointsConfig);
  if (fromStorage) {
    return fromStorage;
  }
  
  // Default to assistants if available (SovereignJK)
  if (endpointsConfig?.['assistants']) {
    return 'assistants' as EModelEndpoint;
  }
  
  // Otherwise agents as fallback
  if (endpointsConfig?.['agents']) {
    return 'agents' as EModelEndpoint;
  }
  
  return getDefinedEndpoint(endpointsConfig);
};

export default getDefaultEndpoint;
