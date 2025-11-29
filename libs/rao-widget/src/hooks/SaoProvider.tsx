import React, { FC, PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SaoContext } from './SaoContext';
import { ISaoContext, type ISaoProvider } from './SaoContext.interface';
import type { ICallState, IMessage, ISessions } from '../interfaces';
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

export const SaoProvider: FC<PropsWithChildren<ISaoProvider>> = ({ children, nuclia, sessionId: sessionIdProp }) => {
  const [sessionsState, _setSessionsState] = useState<ICallState<ISessions>>({});
  const [conversation, setConversation] = useState<IMessage[] | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => sessionIdProp ?? null);

  const chatConnectionRef = useRef<ChatConnection | null>(null);
  const chatAbortControllerRef = useRef<AbortController | null>(null);
  const assistantMessageIdRef = useRef<string | null>(null);
  const lastAssistantMessageIdRef = useRef<string | null>(null);
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
    };
  }, []);

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
    (content: string) => {
      if (!content) {
        return;
      }
      if (!assistantMessageIdRef.current) {
        startAssistantResponse();
      }
      updateAssistantMessage((message) => ({
        ...message,
        content: message.content ? `${message.content}${content}` : content,
      }));
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
  }, [updateAssistantMessage]);

  const handleChatClose = useCallback(() => {
    if (chatAbortControllerRef.current) {
      chatAbortControllerRef.current = null;
    }
    chatConnectionRef.current = null;
    assistantMessageIdRef.current = null;
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

      const text =
        answer.generated_text ??
        answer.answer ??
        (typeof answer.agent_request === 'string' ? answer.agent_request : null);

      if (text) {
        appendAssistantContent(text);
      }
    },
    [
      appendAssistantContent,
      appendAssistantEvent,
      appendAssistantStep,
      finalizeAssistantMessage,
      startAssistantResponse,
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

    let isActive = true;

    const useServiceAccountHeader = Boolean(initialApiKey);

    const fetchToken = async (): Promise<string> => {
      try {
        if (useServiceAccountHeader) {
          fetcher.setBearerToken(null);
        }
        const { token } = await authApi.createEphemeralToken({
          useServiceAccountHeader,
        });
        if (!isActive) {
          return token;
        }
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

    return () => {
      isActive = false;
    };
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
    (
      sessionId: string,
      token: string,
      initialQuestion?: string,
    ): { connection: ChatConnection | null; isNew: boolean } => {
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
          question: initialQuestion,
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

      if (!chatRepository) {
        finalizeAssistantMessage('Error', 'Chat service is not configured.');
        return;
      }

      if (!authToken) {
        finalizeAssistantMessage('Info', 'Assistant is still initializing. Please try again in a moment.');
        return;
      }

      let sessionId: string;
      try {
        sessionId = await resolveSessionId();
      } catch (error) {
        console.error('Failed to resolve session identifier', error);
        finalizeAssistantMessage('Error', 'Unable to start a chat session. Please retry.');
        return;
      }

      const sessionToken = await resolveSessionToken(sessionId);
      if (!sessionToken) {
        finalizeAssistantMessage('Error', 'Assistant token is unavailable. Please try again later.');
        return;
      }

      const { connection, isNew } = ensureChatConnection(sessionId, sessionToken, message);
      if (!connection) {
        finalizeAssistantMessage('Error', 'Unable to connect to the assistant.');
        return;
      }

      if (!isNew) {
        connection.sendQuestion(message);
      }
    },
    [
      appendMessage,
      chatRepository,
      authToken,
      ensureChatConnection,
      resolveSessionId,
      resolveSessionToken,
      finalizeAssistantMessage,
    ],
  );

  const value: ISaoContext = useMemo(
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
    ],
  );

  return <SaoContext.Provider value={value}>{children}</SaoContext.Provider>;
};
