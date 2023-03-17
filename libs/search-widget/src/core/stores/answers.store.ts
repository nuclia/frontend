import { combineLatest } from 'rxjs';
import type { Answer, DialogEntry } from '../answer.models';
import { SvelteState } from '../state-lib';

interface AnswerState {
  dialog: DialogEntry[];
  currentQuestion: string;
  currentAnswer: Answer;
  isStreaming: boolean;
}

const EMPTY_ANSWER = { text: '', sources: [] };
export const answerState = new SvelteState<AnswerState>({
  dialog: [],
  currentQuestion: '',
  currentAnswer: EMPTY_ANSWER,
  isStreaming: false,
});

export const currentQuestion = answerState.writer<string>(
  (state) => state.currentQuestion,
  (state, value) => ({ ...state, currentQuestion: value }),
);

export const currentAnswer = answerState.writer<Partial<Answer>>(
  (state) => state.currentAnswer,
  (state, value) => ({
    ...state,
    currentAnswer: { ...state.currentAnswer, ...value },
    isStreaming: true,
  }),
);

export const firstAnswer = answerState.reader((state) =>
  state.dialog.length === 0 && state.isStreaming
    ? { ...state.currentAnswer, incomplete: true }
    : state.dialog[0]?.answer || EMPTY_ANSWER,
);

export const dialog = answerState.writer<DialogEntry[], { question: string; answer: Answer; reset: boolean }>(
  (state) =>
    state.isStreaming
      ? [...state.dialog, { question: state.currentQuestion, answer: { ...state.currentAnswer, incomplete: true } }]
      : state.dialog,
  (state, params) => ({
    ...state,
    dialog: params.reset
      ? [{ question: params.question, answer: params.answer }]
      : [...state.dialog, { question: params.question, answer: params.answer }],
    currentQuestion: '',
    currentAnswer: EMPTY_ANSWER,
    isStreaming: false,
  }),
);

export const resetDialog = answerState.writer<void>(
  () => undefined,
  (state) => ({ ...state, dialog: state.dialog.slice(0, 1) }),
);

export const isStreaming = answerState.reader((state) => state.isStreaming);
