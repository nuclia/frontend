import { AnswerOperation, InteractionOperation, type AragAnswer } from '@nuclia/core';

type ChatErrorType = 'websocket' | 'parse' | 'agent';

export interface ChatError {
  type: ChatErrorType;
  message?: string;
  cause?: unknown;
  answer?: AragAnswer;
}

export interface ChatHandlers {
  onOpen?: (event: Event) => void;
  onAnswer?: (answer: AragAnswer) => void;
  onDone?: (answer: AragAnswer) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (error: ChatError) => void;
}

export interface ChatRepositoryConfig {
  backendUrl: string;
  knowledgeBoxId?: string;
}

export interface ChatConnectOptions extends ChatHandlers {
  sessionId: string;
  token: string;
  question?: string;
  headers?: Record<string, string>;
  fromCursor?: number;
  signal?: AbortSignal;
  knowledgeBoxId?: string;
}

export interface ChatConnection {
  sendQuestion: (question: string, headers?: Record<string, string>) => void;
  sendQuit: () => void;
  close: (code?: number, reason?: string) => void;
  readonly socket: WebSocket;
}

export interface ChatRepository {
  connect: (options: ChatConnectOptions) => ChatConnection;
  buildSocketUrl: (sessionId: string, token: string, knowledgeBoxId?: string, fromCursor?: number) => string;
}

interface InteractionPayload {
  question: string;
  operation: InteractionOperation;
  headers?: Record<string, string>;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isAragAnswer = (value: unknown): value is AragAnswer => {
  return isRecord(value) && typeof (value as { operation?: unknown }).operation === 'number';
};

const sanitizeHeaders = (headers?: Record<string, string>): Record<string, string> | undefined => {
  if (!headers) {
    return undefined;
  }
  const entries = Object.entries(headers).filter(([key]) => Boolean(key));
  if (entries.length === 0) {
    return undefined;
  }
  return Object.fromEntries(entries);
};

export const createChatRepository = (config: ChatRepositoryConfig): ChatRepository => {
  if (!config?.backendUrl) {
    throw new Error('Chat repository requires a backendUrl.');
  }

  const resolveKnowledgeBox = (override?: string) => {
    const knowledgeBox = override ?? config.knowledgeBoxId;
    if (!knowledgeBox) {
      throw new Error('Knowledge Box identifier is required to start a chat session.');
    }
    return knowledgeBox;
  };

  const buildSocketUrl = (
    sessionId: string,
    token: string,
    knowledgeBoxIdOverride?: string,
    fromCursor?: number,
  ): string => {
    const knowledgeBoxId = resolveKnowledgeBox(knowledgeBoxIdOverride);
    const isEphemeral = sessionId === 'ephemeral';
    const sessionSegment = isEphemeral ? 'ephemeral' : encodeURIComponent(sessionId);

    const path = isEphemeral
      ? `/api/v1/kb/${encodeURIComponent(knowledgeBoxId)}/agent/session/ephemeral/ws`
      : `/api/v1/kb/${encodeURIComponent(knowledgeBoxId)}/agent/session/${sessionSegment}/ws`;
    const url = new URL(path, config.backendUrl);
    if (url.protocol === 'https:') {
      url.protocol = 'wss:';
    } else if (url.protocol === 'http:') {
      url.protocol = 'ws:';
    }
    url.searchParams.set('eph-token', token);
    if (typeof fromCursor === 'number') {
      url.searchParams.set('from_cursor', String(fromCursor));
    }
    return url.toString();
  };

  const connect = (options: ChatConnectOptions): ChatConnection => {
    const {
      sessionId,
      token,
      question,
      headers,
      fromCursor,
      signal,
      knowledgeBoxId: knowledgeBoxOverride,
      onAnswer,
      onClose,
      onDone,
      onError,
      onOpen,
    } = options;

    const socketUrl = buildSocketUrl(sessionId, token, knowledgeBoxOverride, fromCursor);
    const socket = new WebSocket(socketUrl);

    const pendingPayloads: string[] = [];
    let isClosing = false;

    const flushQueue = () => {
      if (socket.readyState !== WebSocket.OPEN) {
        return;
      }
      while (pendingPayloads.length > 0) {
        const payload = pendingPayloads.shift();
        if (payload) {
          socket.send(payload);
        }
      }
    };

    const enqueue = (payload: InteractionPayload) => {
      if (isClosing) {
        return;
      }
      const normalized: InteractionPayload = {
        question: payload.question,
        operation: payload.operation,
      };
      const normalizedHeaders = sanitizeHeaders(payload.headers);
      if (normalizedHeaders) {
        normalized.headers = normalizedHeaders;
      }
      const serialized = JSON.stringify(normalized);
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(serialized);
      } else if (socket.readyState === WebSocket.CONNECTING) {
        pendingPayloads.push(serialized);
      }
    };

    const sendQuestion = (text: string, customHeaders?: Record<string, string>) => {
      if (typeof text !== 'string') {
        return;
      }
      enqueue({
        question: text,
        operation: InteractionOperation.question,
        headers: customHeaders,
      });
    };

    const sendQuit = () => {
      if (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN) {
        enqueue({
          question: '',
          operation: InteractionOperation.quit,
        });
      }
    };

    const dispatchError = (error: ChatError) => {
      if (onError) {
        onError(error);
      }
    };

    const processAnswer = (answer: AragAnswer) => {
      if (onAnswer) {
        onAnswer(answer);
      }

      if (answer.operation === AnswerOperation.error) {
        dispatchError({
          type: 'agent',
          message: answer.exception?.detail ?? 'Agent returned an error.',
          answer,
        });
        return;
      }

      if (answer.operation === AnswerOperation.done && onDone) {
        onDone(answer);
      }
    };

    const handleRawMessage = (raw: string) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch (error) {
        dispatchError({
          type: 'parse',
          message: 'Unable to parse chat message payload.',
          cause: error,
        });
        return;
      }

      if (!isAragAnswer(parsed)) {
        dispatchError({
          type: 'parse',
          message: 'Received unexpected chat payload structure.',
          cause: parsed,
        });
        return;
      }

      processAnswer(parsed);
    };

    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        handleRawMessage(event.data);
        return;
      }

      if (event.data instanceof Blob) {
        event.data
          .text()
          .then(handleRawMessage)
          .catch((error) =>
            dispatchError({
              type: 'parse',
              message: 'Unable to decode binary chat payload.',
              cause: error,
            }),
          );
        return;
      }

      dispatchError({
        type: 'parse',
        message: 'Unsupported chat payload type.',
        cause: event.data,
      });
    };

    const handleOpen = (event: Event) => {
      flushQueue();
      if (onOpen) {
        onOpen(event);
      }
    };

    const handleError = (event: Event) => {
      dispatchError({
        type: 'websocket',
        message: 'Chat websocket emitted an error event.',
        cause: event,
      });
    };

    const messageListener: EventListener = (event) => handleMessage(event as MessageEvent);

    const abortSignal = signal;
    let abortHandler: (() => void) | undefined;

    const cleanup = () => {
      socket.removeEventListener('open', handleOpen);
      socket.removeEventListener('message', messageListener);
      socket.removeEventListener('error', handleError);
      socket.removeEventListener('close', handleClose);
      pendingPayloads.length = 0;
      if (abortSignal && abortHandler) {
        abortSignal.removeEventListener('abort', abortHandler);
      }
    };

    const handleClose = (event: CloseEvent) => {
      isClosing = true;
      cleanup();
      if (onClose) {
        onClose(event);
      }
    };

    socket.addEventListener('open', handleOpen);
    socket.addEventListener('message', messageListener);
    socket.addEventListener('error', handleError);
    socket.addEventListener('close', handleClose);

    abortHandler = () => {
      if (isClosing) {
        return;
      }
      isClosing = true;
      if (socket.readyState === WebSocket.OPEN) {
        sendQuit();
      }
      socket.close(1000, 'aborted');
    };

    if (abortSignal) {
      if (abortSignal.aborted) {
        abortHandler();
      } else {
        abortSignal.addEventListener('abort', abortHandler);
      }
    }

    if (typeof question === 'string') {
      sendQuestion(question, headers);
    }

    const close = (code?: number, reason?: string) => {
      if (isClosing) {
        return;
      }
      isClosing = true;
      if (socket.readyState === WebSocket.OPEN) {
        sendQuit();
      }
      socket.close(code ?? 1000, reason);
    };

    return {
      sendQuestion,
      sendQuit,
      close,
      socket,
    };
  };

  return {
    connect,
    buildSocketUrl,
  };
};
