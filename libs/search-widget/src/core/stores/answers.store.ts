import type { Ask, IErrorResponse } from '@nuclia/core';
import { SvelteState } from '../state-lib';
import { showResults } from './search.store';
import { hasNotEnoughData } from '../utils';

interface AnswerState {
  chat: Ask.Entry[];
  currentQuestion: string;
  currentAnswer: Ask.Answer;
  error?: IErrorResponse;
  isStreaming: boolean;
}

const EMPTY_ANSWER = { type: 'answer' as const, text: '', id: '' };
export const answerState = new SvelteState<AnswerState>({
  chat: [],
  currentQuestion: '',
  currentAnswer: EMPTY_ANSWER,
  isStreaming: false,
});

export const currentQuestion = answerState.writer<string, { question: string; reset: boolean }>(
  (state) => state.currentQuestion,
  (state, value) => ({
    ...state,
    currentQuestion: value.question,
    chat: value.reset ? [] : state.chat,
    isStreaming: true,
    error: undefined,
  }),
);

export const currentAnswer = answerState.writer<Ask.Answer, Partial<Ask.Answer>>(
  (state) => state.currentAnswer,
  (state, value) => {
    showResults.set(true);
    return {
      ...state,
      currentAnswer: { ...state.currentAnswer, ...value },
      isStreaming: true,
    };
  },
);

export const firstAnswer = answerState.reader((state) =>
  state.chat.length === 0 && state.isStreaming
    ? { ...state.currentAnswer, incomplete: true }
    : state.chat[0]?.answer || EMPTY_ANSWER,
);

export const lastFullAnswer = answerState.reader((state) =>
  state.chat.length > 0 && !state.isStreaming ? state.chat[state.chat.length - 1].answer : undefined,
);

export const chat = answerState.writer<Ask.Entry[], { question: string; answer: Ask.Answer }>(
  (state) =>
    state.isStreaming
      ? [...state.chat, { question: state.currentQuestion, answer: { ...state.currentAnswer, incomplete: true } }]
      : state.chat,
  (state, params) => ({
    ...state,
    chat: [
      ...state.chat,
      {
        question: params.question,
        answer: {
          ...params.answer,
          inError: params.answer.inError || hasNotEnoughData(params.answer.text),
        },
      },
    ],
    currentQuestion: '',
    currentAnswer: EMPTY_ANSWER,
    isStreaming: false,
  }),
);

export const resetChat = answerState.writer<void, void>(
  () => undefined,
  (state) => ({ ...state, chat: state.chat.slice(0, 1) }),
);

export const isStreaming = answerState.reader((state) => state.isStreaming);

export const isServiceOverloaded = answerState.reader<boolean>((state) => !!state.error && state.error.status === 529);
export const chatError = answerState.writer<IErrorResponse | undefined>(
  (state) => state.error,
  (state, error) => {
    showResults.set(true);
    return {
      ...state,
      error,
    };
  },
);
