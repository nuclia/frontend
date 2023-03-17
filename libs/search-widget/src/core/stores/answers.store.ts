import type { Answer, ChatEntry } from '../answer.models';
import { SvelteState } from '../state-lib';

interface AnswerState {
  chat: ChatEntry[];
  currentQuestion: string;
  currentAnswer: Answer;
  isStreaming: boolean;
}

const EMPTY_ANSWER = { text: '', sources: [] };
export const answerState = new SvelteState<AnswerState>({
  chat: [],
  currentQuestion: '',
  currentAnswer: EMPTY_ANSWER,
  isStreaming: false,
});

export const currentQuestion = answerState.writer<string>(
  (state) => state.currentQuestion,
  (state, value) => ({ ...state, currentQuestion: value }),
);

export const currentAnswer = answerState.writer<Answer, Partial<Answer>>(
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

export const chat = answerState.writer<ChatEntry[], { question: string; answer: Answer; reset: boolean }>(
  (state) =>
    state.isStreaming
      ? [...state.chat, { question: state.currentQuestion, answer: { ...state.currentAnswer, incomplete: true } }]
      : state.chat,
  (state, params) => ({
    ...state,
    chat: params.reset
      ? [{ question: params.question, answer: params.answer }]
      : [...state.chat, { question: params.question, answer: params.answer }],
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
