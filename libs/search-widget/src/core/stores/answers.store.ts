import type { Chat } from '@nuclia/core';
import { SvelteState } from '../state-lib';

interface AnswerState {
  chat: Chat.Entry[];
  currentQuestion: string;
  currentAnswer: Chat.Answer;
  isStreaming: boolean;
  isSpeechOn: boolean;
}

const EMPTY_ANSWER = { text: '' };
export const answerState = new SvelteState<AnswerState>({
  chat: [],
  currentQuestion: '',
  currentAnswer: EMPTY_ANSWER,
  isStreaming: false,
  isSpeechOn: false,
});

export const currentQuestion = answerState.writer<string, { question: string; reset: boolean }>(
  (state) => state.currentQuestion,
  (state, value) => ({ ...state, currentQuestion: value.question, chat: value.reset ? [] : state.chat }),
);

export const currentAnswer = answerState.writer<Chat.Answer, Partial<Chat.Answer>>(
  (state) => state.currentAnswer,
  (state, value) => ({
    ...state,
    currentAnswer: { ...state.currentAnswer, ...value },
    isStreaming: true,
  }),
);

export const firstAnswer = answerState.reader((state) =>
  state.chat.length === 0 && state.isStreaming
    ? { ...state.currentAnswer, incomplete: true }
    : state.chat[0]?.answer || EMPTY_ANSWER,
);

export const lastFullAnswer = answerState.reader((state) =>
  state.chat.length > 0 && !state.isStreaming ? state.chat[state.chat.length - 1].answer : undefined,
);

export const chat = answerState.writer<Chat.Entry[], { question: string; answer: Chat.Answer }>(
  (state) =>
    state.isStreaming
      ? [...state.chat, { question: state.currentQuestion, answer: { ...state.currentAnswer, incomplete: true } }]
      : state.chat,
  (state, params) => ({
    ...state,
    chat: [...state.chat, { question: params.question, answer: params.answer }],
    currentQuestion: '',
    currentAnswer: EMPTY_ANSWER,
    isStreaming: false,
  }),
);

export const resetChat = answerState.writer<void>(
  () => undefined,
  (state) => ({ ...state, chat: state.chat.slice(0, 1) }),
);

export const isStreaming = answerState.reader((state) => state.isStreaming);

export const isSpeechOn = answerState.writer<boolean, { value?: boolean; toggle?: boolean }>(
  (state) => state.isSpeechOn,
  (state, params) => ({ ...state, isSpeechOn: params.toggle ? !state.isSpeechOn : !!params.value }),
);
