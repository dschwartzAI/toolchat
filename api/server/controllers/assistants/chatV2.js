const { v4 } = require('uuid');
const { sleep } = require('@librechat/agents');
const { sendEvent } = require('@librechat/api');
const { logger } = require('@librechat/data-schemas');
const {
  Time,
  Constants,
  RunStatus,
  CacheKeys,
  ContentTypes,
  ToolCallTypes,
  EModelEndpoint,
  retrievalMimeTypes,
  AssistantStreamEvents,
} = require('librechat-data-provider');
const {
  initThread,
  recordUsage,
  saveUserMessage,
  addThreadMetadata,
  saveAssistantMessage,
} = require('~/server/services/Threads');
const { runAssistant, createOnTextProgress } = require('~/server/services/AssistantService');
const { createErrorHandler } = require('~/server/controllers/assistants/errors');
const validateAuthor = require('~/server/middleware/assistants/validateAuthor');
const { createRun, StreamRunManager } = require('~/server/services/Runs');
const { addTitle } = require('~/server/services/Endpoints/assistants');
const { createRunBody } = require('~/server/services/createRunBody');
const { getTransactions } = require('~/models/Transaction');
const { checkBalance } = require('~/models/balanceMethods');
const { getConvo } = require('~/models/Conversation');
const { getFormattedMemories, setMemory, deleteMemory } = require('~/models');
const { createMemoryProcessor } = require('@librechat/api');
const { HumanMessage } = require('@langchain/core/messages');
const getLogStores = require('~/cache/getLogStores');
const { countTokens } = require('~/server/utils');
const { getModelMaxTokens } = require('~/utils');
const { getOpenAIClient } = require('./helpers');

/**
 * @route POST /
 * @desc Chat with an assistant
 * @access Public
 * @param {Express.Request} req - The request object, containing the request data.
 * @param {Express.Response} res - The response object, used to send back a response.
 * @returns {void}
 */
const chatV2 = async (req, res) => {
  console.log('[chatV2] Function called with body:', req.body);
  logger.debug('[/assistants/chat/] req.body', req.body);

  /** @type {{files: MongoFile[]}} */
  const {
    text,
    model,
    endpoint,
    files = [],
    promptPrefix,
    assistant_id,
    instructions,
    endpointOption,
    thread_id: _thread_id,
    messageId: _messageId,
    conversationId: convoId,
    parentMessageId: _parentId = Constants.NO_PARENT,
    clientTimestamp,
  } = req.body;

  /** @type {OpenAIClient} */
  let openai;
  /** @type {string|undefined} - the current thread id */
  let thread_id = _thread_id;
  /** @type {string|undefined} - the current run id */
  let run_id;
  /** @type {string|undefined} - the parent messageId */
  let parentMessageId = _parentId;
  /** @type {TMessage[]} */
  let previousMessages = [];
  /** @type {import('librechat-data-provider').TConversation | null} */
  let conversation = null;
  /** @type {string[]} */
  let file_ids = [];
  /** @type {Set<string>} */
  let attachedFileIds = new Set();
  /** @type {TMessage | null} */
  let requestMessage = null;

  const userMessageId = v4();
  const responseMessageId = v4();

  /** @type {string} - The conversation UUID - created if undefined */
  const conversationId = convoId ?? v4();

  const cache = getLogStores(CacheKeys.ABORT_KEYS);
  const cacheKey = `${req.user.id}:${conversationId}`;

  /** @type {Run | undefined} - The completed run, undefined if incomplete */
  let completedRun;

  const getContext = () => ({
    openai,
    run_id,
    endpoint,
    cacheKey,
    thread_id,
    completedRun,
    assistant_id,
    conversationId,
    parentMessageId,
    responseMessageId,
  });

  const handleError = createErrorHandler({ req, res, getContext });

  try {
    res.on('close', async () => {
      if (!completedRun) {
        await handleError(new Error('Request closed'));
      }
    });

    if (convoId && !_thread_id) {
      completedRun = true;
      throw new Error('Missing thread_id for existing conversation');
    }

    if (!assistant_id) {
      completedRun = true;
      throw new Error('Missing assistant_id');
    }

    const checkBalanceBeforeRun = async () => {
      const balance = req.app?.locals?.balance;
      if (!balance?.enabled) {
        return;
      }
      const transactions =
        (await getTransactions({
          user: req.user.id,
          context: 'message',
          conversationId,
        })) ?? [];

      const totalPreviousTokens = Math.abs(
        transactions.reduce((acc, curr) => acc + curr.rawAmount, 0),
      );

      // TODO: make promptBuffer a config option; buffer for titles, needs buffer for system instructions
      const promptBuffer = parentMessageId === Constants.NO_PARENT && !_thread_id ? 200 : 0;
      // 5 is added for labels
      let promptTokens = (await countTokens(text + (promptPrefix ?? ''))) + 5;
      promptTokens += totalPreviousTokens + promptBuffer;
      // Count tokens up to the current context window
      promptTokens = Math.min(promptTokens, getModelMaxTokens(model));

      await checkBalance({
        req,
        res,
        txData: {
          model,
          user: req.user.id,
          tokenType: 'prompt',
          amount: promptTokens,
        },
      });
    };

    const { openai: _openai, client } = await getOpenAIClient({
      req,
      res,
      endpointOption,
      initAppClient: true,
    });

    openai = _openai;
    await validateAuthor({ req, openai });

    if (previousMessages.length) {
      parentMessageId = previousMessages[previousMessages.length - 1].messageId;
    }

    let userMessage = {
      role: 'user',
      content: [
        {
          type: ContentTypes.TEXT,
          text,
        },
      ],
      metadata: {
        messageId: userMessageId,
      },
    };

    // Fetch user memories if enabled
    let memoryContext;
    let onboardingGate = '';
    try {
      const user = req.user;
      const memoryConfig = req.app.locals?.memory;
      console.log(`[Memory] Assistant checking memory for user ${user.id}: personalization.memories=${user.personalization?.memories}, memoryConfig.disabled=${memoryConfig?.disabled}`);
      console.log('[Memory] Memory config:', memoryConfig);
      logger.debug(`[Memory] Assistant checking memory for user ${user.id}: personalization.memories=${user.personalization?.memories}, memoryConfig.disabled=${memoryConfig?.disabled}`);
      
      if (user.personalization?.memories !== false && memoryConfig && !memoryConfig.disabled) {
        console.log('[Memory] Fetching memories for assistant...');
        try {
          const memories = await getFormattedMemories({ userId: user.id });
          console.log('[MEMORY] onRetrieve(formatted) user=', user.id, 'totalTokens=', memories?.totalTokens);
          console.log('[Memory] Retrieved memories for assistant:', memories);
          logger.debug(`[Memory] Retrieved memories for assistant:`, memories ? 'Found' : 'None');
          if (memories?.withoutKeys) {
            memoryContext = memories.withoutKeys;
            console.log(`[Memory] Memory context length: ${memoryContext.length} characters`);
            console.log('[Memory] Memory context preview:', memoryContext.substring(0, 200) + '...');
            logger.debug(`[Memory] Memory context length: ${memoryContext.length} characters`);
          }
          const hasBusinessProfile = (memories?.totalTokens || 0) >= 20;
          onboardingGate = `OnboardingGate: has_business_profile=${hasBusinessProfile}. If true, skip onboarding prompts and proceed with normal assistance.`;
        } catch (error) {
          console.error('[Memory] Error calling getFormattedMemories:', error);
          logger.error('[Memory] Error calling getFormattedMemories:', error);
        }
      } else {
        console.log('[Memory] Memory not enabled - conditions not met');
      }
    } catch (error) {
      console.error('[Memory] Error fetching memories for assistant:', error);
      logger.error('[Memory] Error fetching memories for assistant:', error);
    }

    console.log(`[chatV2] Model from client: ${model}`);
    console.log(`[chatV2] Assistant ID: ${assistant_id}`);
    
    /** @type {CreateRunBody | undefined} */
    const effectivePromptPrefix = [promptPrefix, onboardingGate].filter(Boolean).join('\n');
    const body = createRunBody({
      assistant_id,
      model,
      promptPrefix: effectivePromptPrefix,
      instructions,
      endpointOption,
      clientTimestamp,
      memoryContext,
      globalAppend: req.app?.locals?.global?.systemAppend || process.env.GLOBAL_SYSTEM_APPEND,
    });
    
    console.log('[chatV2] Body being sent to OpenAI:', JSON.stringify(body, null, 2));

    const getRequestFileIds = async () => {
      let thread_file_ids = [];
      if (convoId) {
        const convo = await getConvo(req.user.id, convoId);
        if (convo && convo.file_ids) {
          thread_file_ids = convo.file_ids;
        }
      }

      if (files.length || thread_file_ids.length) {
        attachedFileIds = new Set([...file_ids, ...thread_file_ids]);

        let attachmentIndex = 0;
        for (const file of files) {
          file_ids.push(file.file_id);
          if (file.type.startsWith('image')) {
            userMessage.content.push({
              type: ContentTypes.IMAGE_FILE,
              [ContentTypes.IMAGE_FILE]: { file_id: file.file_id },
            });
          }

          if (!userMessage.attachments) {
            userMessage.attachments = [];
          }

          userMessage.attachments.push({
            file_id: file.file_id,
            tools: [{ type: ToolCallTypes.CODE_INTERPRETER }],
          });

          if (file.type.startsWith('image')) {
            continue;
          }

          const mimeType = file.type;
          const isSupportedByRetrieval = retrievalMimeTypes.some((regex) => regex.test(mimeType));
          if (isSupportedByRetrieval) {
            userMessage.attachments[attachmentIndex].tools.push({
              type: ToolCallTypes.FILE_SEARCH,
            });
          }

          attachmentIndex++;
        }
      }
    };

    /** @type {Promise<Run>|undefined} */
    let userMessagePromise;

    const initializeThread = async () => {
      await getRequestFileIds();

      // TODO: may allow multiple messages to be created beforehand in a future update
      const initThreadBody = {
        messages: [userMessage],
        metadata: {
          user: req.user.id,
          conversationId,
        },
      };

      const result = await initThread({ openai, body: initThreadBody, thread_id });
      thread_id = result.thread_id;

      createOnTextProgress({
        openai,
        conversationId,
        userMessageId,
        messageId: responseMessageId,
        thread_id,
      });

      requestMessage = {
        user: req.user.id,
        text,
        messageId: userMessageId,
        parentMessageId,
        // TODO: make sure client sends correct format for `files`, use zod
        files,
        file_ids,
        conversationId,
        isCreatedByUser: true,
        assistant_id,
        thread_id,
        model: assistant_id,
        endpoint,
      };

      previousMessages.push(requestMessage);

      /* asynchronous */
      userMessagePromise = saveUserMessage(req, { ...requestMessage, model });

      conversation = {
        conversationId,
        endpoint,
        promptPrefix: promptPrefix,
        instructions: instructions,
        assistant_id,
        // model,
      };

      if (file_ids.length) {
        conversation.file_ids = file_ids;
      }
    };

    const promises = [initializeThread(), checkBalanceBeforeRun()];
    await Promise.all(promises);

    const sendInitialResponse = () => {
      sendEvent(res, {
        sync: true,
        conversationId,
        // messages: previousMessages,
        requestMessage,
        responseMessage: {
          user: req.user.id,
          messageId: openai.responseMessage.messageId,
          parentMessageId: userMessageId,
          conversationId,
          assistant_id,
          thread_id,
          model: assistant_id,
        },
      });
    };

    /** @type {RunResponse | typeof StreamRunManager | undefined} */
    let response;

    const processRun = async (retry = false) => {
      if (endpoint === EModelEndpoint.azureAssistants) {
        body.model = openai._options.model;
        openai.attachedFileIds = attachedFileIds;
        if (retry) {
          response = await runAssistant({
            openai,
            thread_id,
            run_id,
            in_progress: openai.in_progress,
          });
          return;
        }

        /* NOTE:
         * By default, a Run will use the model and tools configuration specified in Assistant object,
         * but you can override most of these when creating the Run for added flexibility:
         */
        const run = await createRun({
          openai,
          thread_id,
          body,
        });

        run_id = run.id;
        await cache.set(cacheKey, `${thread_id}:${run_id}`, Time.TEN_MINUTES);
        sendInitialResponse();

        // todo: retry logic
        response = await runAssistant({ openai, thread_id, run_id });
        return;
      }

      /** @type {{[AssistantStreamEvents.ThreadRunCreated]: (event: ThreadRunCreated) => Promise<void>}} */
      const handlers = {
        [AssistantStreamEvents.ThreadRunCreated]: async (event) => {
          await cache.set(cacheKey, `${thread_id}:${event.data.id}`, Time.TEN_MINUTES);
          run_id = event.data.id;
          sendInitialResponse();
        },
      };

      /** @type {undefined | TAssistantEndpoint} */
      const config = req.app.locals[endpoint] ?? {};
      /** @type {undefined | TBaseEndpoint} */
      const allConfig = req.app.locals.all;

      const streamRunManager = new StreamRunManager({
        req,
        res,
        openai,
        handlers,
        thread_id,
        attachedFileIds,
        parentMessageId: userMessageId,
        responseMessage: openai.responseMessage,
        streamRate: allConfig?.streamRate ?? config.streamRate,
        // streamOptions: {

        // },
      });

      await streamRunManager.runAssistant({
        thread_id,
        body,
      });

      response = streamRunManager;
      response.text = streamRunManager.intermediateText;
    };

    await processRun();
    logger.debug('[/assistants/chat/] response', {
      run: response.run,
      steps: response.steps,
    });

    if (response.run.status === RunStatus.CANCELLED) {
      logger.debug('[/assistants/chat/] Run cancelled, handled by `abortRun`');
      return res.end();
    }

    if (response.run.status === RunStatus.IN_PROGRESS) {
      processRun(true);
    }

    completedRun = response.run;

    /** @type {ResponseMessage} */
    const responseMessage = {
      ...(response.responseMessage ?? response.finalMessage),
      text: response.text,
      parentMessageId: userMessageId,
      conversationId,
      user: req.user.id,
      assistant_id,
      thread_id,
      model: assistant_id,
      endpoint,
      spec: endpointOption.spec,
      iconURL: endpointOption.iconURL,
    };

    /**
     * Run memory processing before sending final event so UI can receive "attachment" updates
     */
    try {
      const memoryConfig = req.app.locals?.memory;
      const user = req.user;
      if (user.personalization?.memories !== false && memoryConfig && memoryConfig.disabled !== true) {
        // Minimal gating: run freely for new/near-empty memory, or when input likely contains a business fact
        const memSummary = await getFormattedMemories({ userId: user.id });
        const forceMemory = (memSummary?.totalTokens || 0) < 50;
        const maybeFact = /\b(we|our|my|i|company|business|industry|client|ideal client|avatar|pricing|charge|service|offer|goal|challenge|methodology|approach|stage)\b/i.test(text || '');
        const isEarly = (previousMessages?.length || 0) <= 2;

        if (forceMemory || maybeFact || isEarly) {
          const memoryAgentConfig = memoryConfig.agent || {};
          const llmConfig =
            memoryAgentConfig.model && memoryAgentConfig.provider
              ? { provider: memoryAgentConfig.provider, model: memoryAgentConfig.model, ...(memoryAgentConfig.model_parameters || {}) }
              : undefined;

          const [_, processMemory] = await createMemoryProcessor({
            res,
            userId: user.id,
            messageId: openai.responseMessage?.messageId || responseMessageId,
            conversationId,
            memoryMethods: { setMemory, deleteMemory, getFormattedMemories },
            config: {
              validKeys: memoryConfig.validKeys,
              instructions: memoryAgentConfig.instructions,
              llmConfig,
              tokenLimit: memoryConfig.tokenLimit,
            },
          });

          const buffer = `# Current Chat:\n\nUser: ${text}\n\nAssistant: ${response.text || ''}`;
          console.log('[MEMORY] beforeSave(processor) user=', user.id, 'windowSize=', memoryConfig?.messageWindowSize);
          const attachments = await processMemory([new HumanMessage(buffer)]);
          if (Array.isArray(attachments) && attachments.length) {
            for (const attachment of attachments) {
              if (attachment) {
                try {
                  res.write(`event: attachment\ndata: ${JSON.stringify(attachment)}\n\n`);
                } catch {}
              }
            }
          }
          console.log('[MEMORY] afterSave(processor) user=', user.id);
        } else {
          console.log('[MEMORY] gated: skip this turn user=', user.id);
        }
      }
    } catch (err) {
      logger.error('[/assistants/chat/] Memory processing error', err);
    }

    sendEvent(res, {
      final: true,
      conversation,
      requestMessage: {
        parentMessageId,
        thread_id,
      },
    });
    res.end();

    if (userMessagePromise) {
      await userMessagePromise;
    }
    await saveAssistantMessage(req, { ...responseMessage, model });

    if (parentMessageId === Constants.NO_PARENT && !_thread_id) {
      addTitle(req, {
        text,
        responseText: response.text,
        conversationId,
        client,
      });
    }

    await addThreadMetadata({
      openai,
      thread_id,
      messageId: responseMessage.messageId,
      messages: response.messages,
    });

    if (!response.run.usage) {
      await sleep(3000);
      completedRun = await openai.beta.threads.runs.retrieve(thread_id, response.run.id);
      if (completedRun.usage) {
        await recordUsage({
          ...completedRun.usage,
          user: req.user.id,
          model: completedRun.model ?? model,
          conversationId,
        });
      }
    } else {
      await recordUsage({
        ...response.run.usage,
        user: req.user.id,
        model: response.run.model ?? model,
        conversationId,
      });
    }
  } catch (error) {
    await handleError(error);
  }
};

module.exports = chatV2;
