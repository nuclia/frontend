import { combineLatest } from 'rxjs';
import type { Answer, DialogEntry } from '../answer.models';
import { SvelteState } from '../state-lib';

interface AnswerState {
  dialog: DialogEntry[];
  currentAnswer: Answer;
  isStreaming: boolean;
}

const EMPTY_ANSWER = { text: '', sources: [] };
export const answerState = new SvelteState<AnswerState>({
  dialog: [],
  currentAnswer: EMPTY_ANSWER,
  isStreaming: false,
});

export const currentAnswer = answerState.writer<Partial<Answer>>(
  (state) => state.currentAnswer,
  (state, value) => ({
    ...state,
    currentAnswer: { ...state.currentAnswer, ...value },
    isStreaming: true,
  }),
);

export const firstAnswer = answerState.reader((state) =>
  state.isStreaming ? state.currentAnswer : state.dialog[0]?.answer || EMPTY_ANSWER,
);
export const lastOrCurrentAnswer = answerState.reader((state) =>
  state.isStreaming ? state.currentAnswer : state.dialog[state.dialog.length - 1]?.answer || EMPTY_ANSWER,
);

export const dialog = answerState.writer<DialogEntry[], { question: string; answer: Answer; reset: boolean }>(
  (state) => state.dialog,
  (state, params) => ({
    ...state,
    dialog: params.reset
      ? [{ question: params.question, answer: params.answer }]
      : [...state.dialog, { question: params.question, answer: params.answer }],
    currentAnswer: EMPTY_ANSWER,
    isStreaming: false,
  }),
);

export const isStreaming = answerState.reader((state) => state.isStreaming);
