import { type FC, type PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RaoContext } from './RaoContext';
import { type IRaoContext, type IRaoProvider } from './RaoContext.interface';
import type { ICallState, IMessage, IMessageFeedbackOption, ISessions } from '../interfaces';
import {
  createAuthApi,
  createChatRepository,
  createNucliaFetcher,
  createSessionsApi,
  type ChatConnection,
  type ChatError,
  type NucliaFetcher,
  type SessionsApi,
} from '../repository';
import type { AragAnswer } from '@nuclia/core';
import { AnswerOperation } from '@nuclia/core';
import { EViewType, IResources } from '../components/RaoWidget/RaoWidget.interface';
import { DEFAULT_RESOURCES } from '../interfaces/const';

const DEFAULT_ASSISTANT_TITLE = 'Agentic RAG';
const EPHEMERAL_SESSION_ID = 'ephemeral';

const createMessageId = (prefix: string): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

const createSessionSlug = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `session-${timestamp}-${randomPart}`;
};

const injectZoneIntoBackend = (backend: string, zone?: string): string => {
  if (!zone || !backend) {
    return backend;
  }

  try {
    const url = new URL(backend);
    const hostname = url.hostname;
    if (
      hostname.startsWith(`${zone}.`) ||
      hostname === 'localhost' ||
      hostname.includes(':') ||
      /^\d+(?:\.\d+){3}$/.test(hostname)
    ) {
      return backend;
    }

    url.hostname = `${zone}.${hostname}`;
    const result = url.toString();
    if (!backend.endsWith('/') && result.endsWith('/')) {
      return result.slice(0, -1);
    }
    return result;
  } catch (error) {
    return backend;
  }
};

export const RaoProvider: FC<PropsWithChildren<IRaoProvider>> = ({
  children,
  nuclia,
  sessionId: sessionIdProp,
  ...rest
}) => {
  const [visibleViewType, setVisibleViewType] = useState<EViewType>(rest.viewtype ?? 'conversation');
  const [sessionsState, _setSessionsState] = useState<ICallState<ISessions>>({});
  const [conversation, setConversation] = useState<IMessage[] | null>(null);
  const conversationRef = useRef<IMessage[] | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => sessionIdProp ?? null);

  const chatConnectionRef = useRef<ChatConnection | null>(null);
  const chatAbortControllerRef = useRef<AbortController | null>(null);
  const assistantMessageIdRef = useRef<string | null>(null);
  const lastAssistantMessageIdRef = useRef<string | null>(null);
  const lastAssistantTextRef = useRef<string | null>(null);
  const cachedTokenRef = useRef<string | null>(null);
  const pendingTokenRequestRef = useRef<Promise<string | null> | null>(null);
  const pendingSessionRequestRef = useRef<Promise<string> | null>(null);
  const sessionTokenCacheRef = useRef<Record<string, string>>({});
  const pendingSessionTokenRequestRef = useRef<Record<string, Promise<string | null>>>({});

  const backend = nuclia?.options?.backend ?? null;
  const zone = nuclia?.options?.zone;
  const accountHeader = nuclia?.options?.accountId ?? nuclia?.options?.account;
  const knowledgeBoxHeader = nuclia?.options?.knowledgeBox;
  const initialApiKey = nuclia?.options?.apiKey;
  const ndb = nuclia?.options?.client;

  const text: IResources = useMemo(
    () => ({
      ...DEFAULT_RESOURCES,
      ...rest.resources,
    }),
    [rest.resources],
  );

  const assistantTitle = useMemo(
    () => nuclia?.auth?.preview_short ?? nuclia?.auth?.name ?? DEFAULT_ASSISTANT_TITLE,
    [nuclia?.auth?.preview_short, nuclia?.auth?.name],
  );

  const regionalBackend = useMemo(() => {
    if (!backend) {
      return null;
    }
    return injectZoneIntoBackend(backend, zone);
  }, [backend, zone]);

  const fetcher: NucliaFetcher | undefined = useMemo(() => {
    if (!regionalBackend) {
      return undefined;
    }

    const headers: Record<string, string> = {};
    if (zone) {
      headers['X-Nuclia-Zone'] = zone;
    }
    if (knowledgeBoxHeader) {
      headers['X-Nuclia-KnowledgeBox'] = knowledgeBoxHeader;
    }
    if (ndb) {
      headers['X-Ndb-Client'] = ndb;
    }

    return createNucliaFetcher({
      baseUrl: regionalBackend,
      headers,
    });
  }, [regionalBackend, zone, knowledgeBoxHeader, ndb]);

  const chatRepository = useMemo(() => {
    if (!regionalBackend || !knowledgeBoxHeader) {
      return undefined;
    }
    return createChatRepository({
      backendUrl: regionalBackend,
      knowledgeBoxId: knowledgeBoxHeader,
    });
  }, [regionalBackend, knowledgeBoxHeader]);

  const sessionsApi: SessionsApi | undefined = useMemo(() => {
    if (!fetcher || !knowledgeBoxHeader) {
      return undefined;
    }
    return createSessionsApi(fetcher, knowledgeBoxHeader);
  }, [fetcher, knowledgeBoxHeader]);

  const authApi = useMemo(() => {
    if (!fetcher || !accountHeader || !knowledgeBoxHeader) {
      return undefined;
    }
    const useServiceAccountHeader = Boolean(initialApiKey);
    return createAuthApi(fetcher, accountHeader, knowledgeBoxHeader, {
      serviceAccountKey: initialApiKey,
      defaultUseServiceAccountHeader: useServiceAccountHeader,
    });
  }, [fetcher, accountHeader, knowledgeBoxHeader, initialApiKey]);

  useEffect(() => {
    if (sessionIdProp === undefined) {
      return;
    }
    setActiveSessionId(sessionIdProp ?? null);
  }, [sessionIdProp]);

  useEffect(() => {
    setConversation(null);
    assistantMessageIdRef.current = null;
    lastAssistantMessageIdRef.current = null;
    lastAssistantTextRef.current = null;
    pendingSessionRequestRef.current = null;
    sessionTokenCacheRef.current = {};
    pendingSessionTokenRequestRef.current = {};
    if (chatAbortControllerRef.current) {
      chatAbortControllerRef.current.abort();
      chatAbortControllerRef.current = null;
    }
    if (chatConnectionRef.current) {
      chatConnectionRef.current.close(1000, 'session changed');
      chatConnectionRef.current = null;
    }
    if (sessionIdProp === undefined) {
      setActiveSessionId(null);
    }
  }, [regionalBackend, knowledgeBoxHeader, sessionIdProp]);

  useEffect(() => {
    return () => {
      if (chatAbortControllerRef.current) {
        chatAbortControllerRef.current.abort();
        chatAbortControllerRef.current = null;
      }
      if (chatConnectionRef.current) {
        chatConnectionRef.current.close(1000, 'provider disposed');
        chatConnectionRef.current = null;
      }
      assistantMessageIdRef.current = null;
      lastAssistantMessageIdRef.current = null;
      lastAssistantTextRef.current = null;
    };
  }, []);

  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  const appendMessage = useCallback((message: IMessage) => {
    setConversation((prev) => {
      const current = prev ?? [];
      return [...current, message];
    });
  }, []);

  const updateAssistantMessage = useCallback((updater: (message: IMessage) => IMessage, targetId?: string | null) => {
    setConversation((prev) => {
      if (!prev) {
        return prev;
      }

      const activeId = targetId ?? assistantMessageIdRef.current;
      if (!activeId) {
        return prev;
      }

      return prev.map((message) => {
        if (message.id !== activeId) {
          return message;
        }
        return updater(message);
      });
    });
  }, []);

  const startAssistantResponse = useCallback(() => {
    if (!assistantMessageIdRef.current) {
      const id = createMessageId('assistant');
      assistantMessageIdRef.current = id;
      lastAssistantMessageIdRef.current = id;
      lastAssistantTextRef.current = null;
      setConversation((prev) => {
        const current = prev ?? [];
        return [
          ...current,
          {
            id,
            role: 'assistant',
            title: assistantTitle,
            meta: 'Generating response...',
            content: '',
            debug: [],
          },
        ];
      });
      return;
    }

    updateAssistantMessage((message) => ({
      ...message,
      meta: 'Generating response...',
    }));
    if (assistantMessageIdRef.current) {
      lastAssistantMessageIdRef.current = assistantMessageIdRef.current;
    }
  }, [assistantTitle, updateAssistantMessage]);

  const appendAssistantContent = useCallback(
    (rawContent: string) => {
      if (typeof rawContent !== 'string') {
        return;
      }

      const trimmed = rawContent.trim();
      if (!trimmed) {
        return;
      }

      if (lastAssistantTextRef.current === trimmed) {
        return;
      }
      if (!assistantMessageIdRef.current) {
        startAssistantResponse();
      }
      lastAssistantTextRef.current = trimmed;
      updateAssistantMessage((message) => {
        const existing = message.content ?? '';
        const shouldSeparate =
          existing.length > 0 &&
          trimmed.length === rawContent.length &&
          !existing.endsWith('\n') &&
          !rawContent.startsWith('\n');
        return {
          ...message,
          content: shouldSeparate ? `${existing}\n\n${rawContent}` : `${existing}${rawContent}`,
        };
      });
    },
    [startAssistantResponse, updateAssistantMessage],
  );

  const appendAssistantEvent = useCallback(
    (event: AragAnswer) => {
      if (!event) {
        return;
      }

      const targetId = assistantMessageIdRef.current ?? lastAssistantMessageIdRef.current;
      if (!targetId) {
        return;
      }

      updateAssistantMessage(
        (message) => ({
          ...message,
          debug: [...(message.debug ?? []), event],
        }),
        targetId,
      );

      lastAssistantMessageIdRef.current = targetId;
    },
    [updateAssistantMessage],
  );

  const appendAssistantStep = useCallback(
    (step: NonNullable<AragAnswer['step']>) => {
      const summary = step.title ?? step.module ?? 'Step update';
      const detail = step.reason ?? step.agent_path ?? '';
      const entry = detail ? `${summary}: ${detail}` : summary;
      if (!assistantMessageIdRef.current) {
        startAssistantResponse();
      }
      updateAssistantMessage((message) => {
        const existing = message.list ?? [];
        if (existing.includes(entry)) {
          return message;
        }
        return {
          ...message,
          list: [...existing, entry],
        };
      });
    },
    [startAssistantResponse, updateAssistantMessage],
  );

  const finalizeAssistantMessage = useCallback(
    (meta: string, content: string) => {
      startAssistantResponse();
      const targetId = assistantMessageIdRef.current ?? lastAssistantMessageIdRef.current;
      updateAssistantMessage(
        (message) => ({
          ...message,
          meta,
          content,
        }),
        targetId,
      );
      if (targetId) {
        lastAssistantMessageIdRef.current = targetId;
      }
      assistantMessageIdRef.current = null;
      lastAssistantTextRef.current = null;
    },
    [startAssistantResponse, updateAssistantMessage],
  );

  const completeAssistantResponse = useCallback(() => {
    const targetId = assistantMessageIdRef.current ?? lastAssistantMessageIdRef.current;
    if (!targetId) {
      return;
    }
    updateAssistantMessage(
      (message) => ({
        ...message,
        meta: 'Response generated',
        content: message.content.trim(),
      }),
      targetId,
    );
    assistantMessageIdRef.current = null;
    lastAssistantMessageIdRef.current = null;
    lastAssistantTextRef.current = null;
  }, [updateAssistantMessage]);

  const toFeedbackOption = (entry: unknown, index: number): IMessageFeedbackOption | null => {
    if (!entry || typeof entry !== 'object') {
      return null;
    }

    const record = entry as Record<string, unknown>;
    const rawName = typeof record.name === 'string' && record.name.trim().length > 0 ? record.name.trim() : '';
    const baseName = rawName || `option-${index + 1}`;
    const uniqueId = `${baseName}-${index}`;
    const title = typeof record.title === 'string' && record.title.trim().length > 0 ? record.title.trim() : baseName;
    const description = typeof record.description === 'string' ? record.description : undefined;
    const args = Object.prototype.hasOwnProperty.call(record, 'arguments') ? record.arguments : undefined;
    const metaValue =
      record.meta && typeof record.meta === 'object' && record.meta !== null
        ? (record.meta as Record<string, unknown>)
        : null;

    return {
      id: uniqueId,
      name: baseName,
      title,
      description,
      arguments: args,
      meta: metaValue,
      raw: record,
    };
  };

  const extractArgumentDefaults = (args: unknown): Record<string, unknown> => {
    if (Array.isArray(args)) {
      return args.reduce(
        (acc, entry) => {
          if (!entry || typeof entry !== 'object') {
            return acc;
          }
          const record = entry as Record<string, unknown>;
          const key = typeof record.name === 'string' && record.name.trim().length > 0 ? record.name.trim() : null;
          if (!key) {
            return acc;
          }

          if (Object.prototype.hasOwnProperty.call(record, 'value')) {
            acc[key] = (record as { value: unknown }).value;
            return acc;
          }
          if (Object.prototype.hasOwnProperty.call(record, 'default')) {
            acc[key] = (record as { default: unknown }).default;
            return acc;
          }
          if (Object.prototype.hasOwnProperty.call(record, 'example')) {
            acc[key] = (record as { example: unknown }).example;
            return acc;
          }

          acc[key] = null;
          return acc;
        },
        {} as Record<string, unknown>,
      );
    }

    if (args && typeof args === 'object') {
      return { ...(args as Record<string, unknown>) };
    }

    return {};
  };

  const buildFeedbackPayload = (schema: unknown, option: IMessageFeedbackOption): Record<string, unknown> => {
    const promptId = option.name || option.id;
    const dataDefaults = extractArgumentDefaults(option.arguments);

    const payload: Record<string, unknown> = {
      prompt_id: promptId,
      data: dataDefaults,
    };

    if (schema && typeof schema === 'object' && schema !== null) {
      const schemaRecord = schema as Record<string, unknown>;
      const defaultData = schemaRecord.default;
      if (defaultData && typeof defaultData === 'object') {
        payload.data = {
          ...(defaultData as Record<string, unknown>),
          ...dataDefaults,
        };
      }
    }

    return payload;
  };

  const handleChatClose = useCallback(() => {
    if (chatAbortControllerRef.current) {
      chatAbortControllerRef.current = null;
    }
    chatConnectionRef.current = null;
    assistantMessageIdRef.current = null;
    lastAssistantMessageIdRef.current = null;
    lastAssistantTextRef.current = null;
  }, []);

  const handleChatError = useCallback(
    (error: ChatError) => {
      const detail =
        error.answer?.exception?.detail ??
        (typeof error.cause === 'object' && error.cause && 'message' in (error.cause as Record<string, unknown>)
          ? String((error.cause as { message?: unknown }).message)
          : undefined) ??
        error.message ??
        'Unexpected chat error.';
      finalizeAssistantMessage('Error', detail);
      handleChatClose();
    },
    [finalizeAssistantMessage, handleChatClose],
  );

  const handleAnswerMessage = useCallback(
    (answer: AragAnswer) => {
      if (answer.operation === AnswerOperation.start) {
        startAssistantResponse();
        appendAssistantEvent(answer);
        return;
      }

      if (answer.operation === AnswerOperation.agent_request && answer.feedback) {
        const feedback = answer.feedback;
        // Remove the in-progress assistant placeholder, we're switching to feedback interaction
        const targetId = assistantMessageIdRef.current ?? lastAssistantMessageIdRef.current;
        if (targetId) {
          setConversation((prev) => (prev ? prev.filter((m) => m.id !== targetId) : prev));
        }
        const rawOptions = Array.isArray(feedback.data) ? feedback.data : [];
        const options = rawOptions
          .map((entry, index) => toFeedbackOption(entry, index))
          .filter(Boolean) as IMessageFeedbackOption[];

        const questionText =
          typeof feedback.question === 'string' && feedback.question.trim().length > 0
            ? feedback.question.trim()
            : text.feedback_choose;

        appendMessage({
          id: createMessageId('assistant-feedback'),
          role: 'assistant',
          content: questionText,
          meta: text.meta_agentrequest,
          debug: [answer],
          feedback: {
            feedbackId: feedback.feedback_id,
            requestId: feedback.request_id,
            question: questionText,
            module: feedback.module ?? undefined,
            agentId: feedback.agent_id ?? undefined,
            timeoutMs: feedback.timeout_ms ?? undefined,
            responseSchema: feedback.response_schema ?? undefined,
            options,
            status: options.length > 0 ? 'pending' : 'error',
            selectedOptionId: undefined,
            error: options.length > 0 ? null : text.feedback_error,
          },
        });

        assistantMessageIdRef.current = null;
        lastAssistantMessageIdRef.current = null;
        lastAssistantTextRef.current = null;
        return;
      }

      appendAssistantEvent(answer);

      if (answer.operation === AnswerOperation.error) {
        const detail = answer.exception?.detail ?? 'Assistant returned an error.';
        finalizeAssistantMessage('Error', detail);
        return;
      }

      if (answer.operation === AnswerOperation.done) {
        return;
      }

      if (answer.step) {
        appendAssistantStep(answer.step);
      }

      const normalizeText = (value: unknown): string | null => {
        if (typeof value !== 'string') {
          return null;
        }
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
      };

      const extractPossibleAnswerText = (candidate: unknown): string | null => {
        if (!candidate || typeof candidate !== 'object') {
          return null;
        }
        const record = candidate as Record<string, unknown>;
        return normalizeText(record.answer);
      };

      const candidateTexts: Array<string | null> = [
        normalizeText(answer.generated_text),
        normalizeText(answer.answer),
        extractPossibleAnswerText(answer.possible_answer),
        normalizeText(answer.agent_request),
      ];

      const messageText = candidateTexts.find((entry) => entry);

      if (messageText) {
        appendAssistantContent(messageText);
      } else if (answer.step) {
        const fallbackFromStep = normalizeText(answer.step.value);
        if (fallbackFromStep && fallbackFromStep.endsWith('?')) {
          appendAssistantContent(fallbackFromStep);
        }
      }
    },
    [
      appendAssistantContent,
      appendAssistantEvent,
      appendAssistantStep,
      appendMessage,
      finalizeAssistantMessage,
      startAssistantResponse,
      text,
      toFeedbackOption,
    ],
  );

  const handleAnswerDone = useCallback(() => {
    completeAssistantResponse();
  }, [completeAssistantResponse]);

  useEffect(() => {
    if (!fetcher || !authApi) {
      setAuthToken(null);
      cachedTokenRef.current = null;
      pendingTokenRequestRef.current = null;
      sessionTokenCacheRef.current = {};
      pendingSessionTokenRequestRef.current = {};
      return;
    }

    const cachedToken = cachedTokenRef.current;
    if (cachedToken) {
      fetcher.setBearerToken(cachedToken);
      if (authToken !== cachedToken) {
        setAuthToken(cachedToken);
      }
      return;
    }

    if (pendingTokenRequestRef.current) {
      return;
    }

    const useServiceAccountHeader = Boolean(initialApiKey);

    const fetchToken = async (): Promise<string> => {
      try {
        if (useServiceAccountHeader) {
          fetcher.setBearerToken(null);
        }
        const { token } = await authApi.createEphemeralToken({
          useServiceAccountHeader,
        });
        fetcher.setBearerToken(token);
        cachedTokenRef.current = token;
        setAuthToken(token);
        return token;
      } catch (error) {
        console.error('Failed to fetch ephemeral token', error);
        throw error;
      }
    };

    const promise = fetchToken()
      .catch(() => null)
      .finally(() => {
        if (pendingTokenRequestRef.current === promise) {
          pendingTokenRequestRef.current = null;
        }
      });

    pendingTokenRequestRef.current = promise;

    return () => {};
  }, [fetcher, authApi, initialApiKey, authToken]);

  const fetchSessions = useCallback(
    async (key: string = 'default') => {
      if (!sessionsApi) {
        return;
      }

      const sessions = await sessionsApi.list();
      _setSessionsState((prev) => ({
        ...prev,
        [key]: {
          data: sessions,
          status: 'success',
        },
      }));
    },
    [sessionsApi],
  );

  const getSessions = useCallback(
    (key: string = 'default') => {
      return sessionsState[key];
    },
    [sessionsState],
  );

  const resolveSessionId = useCallback(async (): Promise<string> => {
    if (activeSessionId) {
      return activeSessionId;
    }

    if (!sessionsApi) {
      setActiveSessionId(EPHEMERAL_SESSION_ID);
      return EPHEMERAL_SESSION_ID;
    }

    if (pendingSessionRequestRef.current) {
      return pendingSessionRequestRef.current;
    }

    const slug = createSessionSlug();
    let request: Promise<string>;

    request = sessionsApi
      .create({
        slug,
        name: `Session ${new Date().toISOString()}`,
      })
      .then((session) => {
        const sessionUuid = session.uuid ?? slug;
        setActiveSessionId(sessionUuid);
        return sessionUuid;
      })
      .catch((error) => {
        console.warn('Falling back to ephemeral session', error);
        setActiveSessionId(EPHEMERAL_SESSION_ID);
        return EPHEMERAL_SESSION_ID;
      })
      .finally(() => {
        if (pendingSessionRequestRef.current === request) {
          pendingSessionRequestRef.current = null;
        }
      });

    pendingSessionRequestRef.current = request;
    return request;
  }, [activeSessionId, sessionsApi]);

  const resolveSessionToken = useCallback(
    async (sessionId: string): Promise<string | null> => {
      if (!authApi) {
        return authToken;
      }

      const shouldUseServiceAccountHeader = Boolean(initialApiKey);

      const cachedToken = sessionTokenCacheRef.current[sessionId];
      if (cachedToken) {
        return cachedToken;
      }

      const pendingToken = pendingSessionTokenRequestRef.current[sessionId];
      if (pendingToken) {
        return pendingToken;
      }

      const bearerToRestore = shouldUseServiceAccountHeader ? cachedTokenRef.current : null;
      if (shouldUseServiceAccountHeader && fetcher) {
        fetcher.setBearerToken(null);
      }

      const request = authApi
        .createEphemeralToken({
          useServiceAccountHeader: shouldUseServiceAccountHeader,
          payload: {
            agent_session: sessionId,
          },
        })
        .then(({ token }) => {
          sessionTokenCacheRef.current[sessionId] = token;
          return token;
        })
        .catch((error) => {
          console.error('Failed to fetch agent session token', error);
          if (authToken) {
            sessionTokenCacheRef.current[sessionId] = authToken;
          }
          return authToken;
        })
        .finally(() => {
          if (shouldUseServiceAccountHeader && fetcher) {
            fetcher.setBearerToken(bearerToRestore ?? null);
          }
          if (pendingSessionTokenRequestRef.current[sessionId] === request) {
            delete pendingSessionTokenRequestRef.current[sessionId];
          }
        });

      pendingSessionTokenRequestRef.current[sessionId] = request;
      return request;
    },
    [authApi, authToken, fetcher, initialApiKey],
  );

  const ensureChatConnection = useCallback(
    (sessionId: string, token: string): { connection: ChatConnection | null; isNew: boolean } => {
      const current = chatConnectionRef.current;

      if (current) {
        if (current.socket.readyState === WebSocket.OPEN || current.socket.readyState === WebSocket.CONNECTING) {
          return { connection: current, isNew: false };
        }

        try {
          current.close(1000, 'replacing connection');
        } catch (error) {
          console.warn('Failed to close stale chat connection', error);
        }
        chatConnectionRef.current = null;
      }

      if (!chatRepository) {
        return { connection: null, isNew: false };
      }

      const controller = new AbortController();
      chatAbortControllerRef.current = controller;

      try {
        const connection = chatRepository.connect({
          sessionId,
          token,
          signal: controller.signal,
          onOpen: startAssistantResponse,
          onAnswer: handleAnswerMessage,
          onDone: () => handleAnswerDone(),
          onError: handleChatError,
          onClose: () => handleChatClose(),
        });
        chatConnectionRef.current = connection;
        return { connection, isNew: true };
      } catch (error) {
        handleChatError({
          type: 'websocket',
          message: error instanceof Error ? error.message : 'Unable to start chat connection.',
          cause: error,
        });
        return { connection: null, isNew: false };
      }
    },
    [chatRepository, startAssistantResponse, handleAnswerMessage, handleAnswerDone, handleChatError, handleChatClose],
  );

  const dispatchChatPayload = useCallback(
    async (
      payload: string,
      options?: {
        suppressErrorMessage?: boolean;
        headers?: Record<string, string>;
      },
    ): Promise<boolean> => {
      const notifyError = (meta: string, content: string) => {
        if (options?.suppressErrorMessage) {
          return;
        }
        finalizeAssistantMessage(meta, content);
      };

      if (!chatRepository) {
        notifyError('Error', 'Chat service is not configured.');
        return false;
      }
      if (!authToken) {
        notifyError('Info', 'Assistant is still initializing. Please try again in a moment.');
        return false;
      }

      let sessionId: string;
      try {
        sessionId = await resolveSessionId();
      } catch (error) {
        console.error('Failed to resolve session identifier', error);
        notifyError('Error', 'Unable to start a chat session. Please retry.');
        return false;
      }

      const sessionToken = await resolveSessionToken(sessionId);
      if (!sessionToken) {
        notifyError('Error', 'Assistant token is unavailable. Please try again later.');
        return false;
      }

      const { connection } = ensureChatConnection(sessionId, sessionToken);
      if (!connection) {
        notifyError('Error', 'Unable to connect to the assistant.');
        return false;
      }

      connection.sendQuestion(payload, options?.headers);

      return true;
    },
    [authToken, chatRepository, ensureChatConnection, finalizeAssistantMessage, resolveSessionId, resolveSessionToken],
  );

  const handleChat = useCallback(
    async (prompt: string) => {
      const message = prompt.trim();
      if (!message) {
        return;
      }

      appendMessage({
        id: createMessageId('user'),
        role: 'user',
        content: message,
      });

      assistantMessageIdRef.current = null;
      lastAssistantMessageIdRef.current = null;
      lastAssistantTextRef.current = null;

      await dispatchChatPayload(message);
    },
    [appendMessage, dispatchChatPayload],
  );

  const handleFeedbackResponse = useCallback(
    async (messageId: string, optionId: string) => {
      // Resolve the selected option and schema from the latest state to avoid races
      const currentMessages = conversationRef.current ?? [];
      const target = currentMessages.find((m) => m.id === messageId && m.feedback);
      if (!target || !target.feedback) {
        return;
      }
      if (target.feedback.status === 'submitting' || target.feedback.status === 'completed') {
        return;
      }
      const selected = target.feedback.options.find((o) => o.id === optionId);
      if (!selected) {
        return;
      }

      setConversation((prev) => {
        if (!prev) return prev;
        return prev.map((message) => {
          if (message.id !== messageId || !message.feedback) return message;
          return {
            ...message,
            feedback: {
              ...message.feedback,
              status: 'submitting',
              selectedOptionId: optionId,
              error: null,
            },
          };
        });
      });

      const payload = buildFeedbackPayload(target.feedback.responseSchema, selected);
      let serializedPayload: string;
      try {
        serializedPayload = JSON.stringify(payload);
      } catch (error) {
        console.error('Unable to serialize feedback payload', error);
        setConversation((prev) => {
          if (!prev) {
            return prev;
          }
          return prev.map((message) => {
            if (message.id !== messageId || !message.feedback) {
              return message;
            }
            return {
              ...message,
              feedback: {
                ...message.feedback,
                status: 'error',
                error: text.feedback_error,
                selectedOptionId: undefined,
              },
            };
          });
        });
        return;
      }

      // Optimistically mark as completed; send in background and revert on failure
      setConversation((prev) => {
        if (!prev) {
          return prev;
        }
        return prev.map((message) => {
          if (message.id !== messageId || !message.feedback) {
            return message;
          }
          return {
            ...message,
            feedback: {
              ...message.feedback,
              status: 'completed',
              error: null,
            },
          };
        });
      });

      // If socket is not usable, force a fresh connection for reliability
      const socket = chatConnectionRef.current?.socket;
      if (!socket || (socket.readyState !== WebSocket.OPEN && socket.readyState !== WebSocket.CONNECTING)) {
        try {
          chatConnectionRef.current?.close(1000, 'reconnect for feedback');
        } catch {}
        chatConnectionRef.current = null;
      }

      console.debug('[RAO] Sending feedback selection', {
        messageId,
        optionId,
        socketState: chatConnectionRef.current?.socket?.readyState,
        payload,
      });

      // Send as JSON content to ensure backend parses it as structured input
      const sendHeaders = { 'content-type': 'application/json' } as Record<string, string>;
      dispatchChatPayload(serializedPayload, { suppressErrorMessage: true, headers: sendHeaders })
        .then((success) => {
          if (success) {
            return;
          }
          setConversation((prev) => {
            if (!prev) {
              return prev;
            }
            return prev.map((message) => {
              if (message.id !== messageId || !message.feedback) {
                return message;
              }
              return {
                ...message,
                feedback: {
                  ...message.feedback,
                  status: 'error',
                  error: text.feedback_error,
                  selectedOptionId: undefined,
                },
              };
            });
          });
        })
        .catch((error) => {
          console.error('Failed to dispatch feedback payload', error);
          setConversation((prev) => {
            if (!prev) {
              return prev;
            }
            return prev.map((message) => {
              if (message.id !== messageId || !message.feedback) {
                return message;
              }
              return {
                ...message,
                feedback: {
                  ...message.feedback,
                  status: 'error',
                  error: text.feedback_error,
                  selectedOptionId: undefined,
                },
              };
            });
          });
        });
    },
    [buildFeedbackPayload, dispatchChatPayload, text.feedback_error],
  );

  const value: IRaoContext = useMemo(
    () => ({
      nuclia: nuclia ?? null,
      sessionId: activeSessionId,
      sessions: sessionsState,
      getSessionsAPI: fetchSessions,
      getSessions,
      fetcher,
      sessionsApi,
      authToken,

      activeView: conversation ? 'conversation' : 'main',
      conversation,
      onChat: handleChat,
      onFeedbackResponse: handleFeedbackResponse,

      visibleViewType,
      setVisibleViewType,

      resources: text,
    }),
    [
      nuclia,
      activeSessionId,
      sessionsState,
      fetchSessions,
      getSessions,
      fetcher,
      sessionsApi,
      authToken,
      conversation,
      handleChat,
      handleFeedbackResponse,

      visibleViewType,
      setVisibleViewType,

      text,
    ],
  );

  return <RaoContext.Provider value={value}>{children}</RaoContext.Provider>;
};
