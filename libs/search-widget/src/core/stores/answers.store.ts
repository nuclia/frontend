import { Search, type Ask, type IErrorResponse } from '@nuclia/core';
import { SvelteState } from '../state-lib';
import { showResults } from './search.store';

interface AnswerState {
  chat: Ask.Entry[];
  currentQuestion: string;
  currentAnswer: Ask.Answer;
  error?: IErrorResponse;
  isStreaming: boolean;
  isSpeechOn: boolean;
  input: string;
  disclaimer?: string;
  notEnoughData: boolean;
  hideAnswer: boolean;
}

const EMPTY_ANSWER = { type: 'answer' as const, text: '', id: '' };
export const answerState = new SvelteState<AnswerState>({
  chat: [],
  currentQuestion: '',
  currentAnswer: EMPTY_ANSWER,
  isStreaming: false,
  isSpeechOn: false,
  input: '',
  notEnoughData: false,
  hideAnswer: false,
});

export const chatInput = answerState.writer<string, string>(
  (state) => state.input,
  (state, value) => ({ ...state, input: value }),
);

export const currentQuestion = answerState.writer<string, { question: string; reset: boolean }>(
  (state) => state.currentQuestion,
  (state, value) => ({
    ...state,
    currentQuestion: value.question,
    chat: value.reset ? [] : state.chat,
    isStreaming: true,
    error: undefined,
    input: '',
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

export const isReasoning = answerState.reader((state) => !state.currentAnswer.text && !!state.currentAnswer.reasoning);

export const lastFullAnswer = answerState.reader((state) =>
  state.chat.length > 0 && !state.isStreaming ? state.chat[state.chat.length - 1].answer : undefined,
);

export const lastSpeakableFullAnswer = answerState.reader((state) =>
  state.chat.length > 0 && !state.isStreaming && state.isSpeechOn
    ? state.chat[state.chat.length - 1].answer
    : undefined,
);

export const chat = answerState.writer<Ask.Entry[]>(
  (state) =>
    state.isStreaming
      ? [...state.chat, { question: state.currentQuestion, answer: { ...state.currentAnswer, incomplete: true } }]
      : state.chat,
  (state, params) => ({
    ...state,
    chat: params,
  }),
);

export const appendChatEntry = answerState.writer<undefined, { question: string; answer: Ask.Answer }>(
  () => undefined,
  (state, params) => ({
    ...state,
    chat: [
      ...state.chat,
      {
        question: params.question,
        answer: {
          ...params.answer,
          inError: params.answer.inError,
        },
      },
    ],
    currentQuestion: '',
    currentAnswer: EMPTY_ANSWER,
    isStreaming: false,
  }),
);

export const jsonAnswer = answerState.reader<any>((state) => {
  const schema = state.chat[0]?.answer.jsonAnswer;
  // if the schema contains a property "answer", it will be displayed as the answer, so we don't return it in the jsonAnswer schema
  if (typeof schema?.['answer'] === 'string') {
    delete schema['answer'];
  }
  return schema;
});

export const reinitChat = answerState.writer<void, void>(
  () => undefined,
  (state) => ({ ...state, chat: state.chat.slice(0, 1) }),
);

export const resetChat = answerState.writer<void, void>(
  () => undefined,
  (state) => ({ ...state, chat: [] }),
);

export const isStreaming = answerState.reader((state) => state.isStreaming);

export const isSpeechOn = answerState.writer<boolean, { value?: boolean; toggle?: boolean }>(
  (state) => state.isSpeechOn,
  (state, params) => ({ ...state, isSpeechOn: params.toggle ? !state.isSpeechOn : !!params.value }),
);

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

export const hasChatEntries = answerState.reader<boolean>((state) => state.chat.length > 0);

export const disclaimer = answerState.writer<string | undefined, string | undefined>(
  (state) => state.disclaimer,
  (state, value) => ({ ...state, disclaimer: value }),
);

export const hasNotEnoughData = answerState.writer<boolean, boolean>(
  (state) => state.notEnoughData,
  (state, param) => ({ ...state, notEnoughData: param }),
);

export const hideAnswer = answerState.writer<boolean, boolean>(
  (state) => state.hideAnswer,
  (state, param) => ({ ...state, hideAnswer: param }),
);

export function getFindParagraphFromAugmentedParagraph(paragraph: Ask.AugmentedContextText): Search.FindParagraph {
  const position = paragraph.id.split('/').pop()?.split('-');
  return {
    order: 0,
    score: 1,
    score_type: Search.FindScoreType.BOTH,
    text: paragraph.text,
    id: paragraph.id,
    labels: [],
    position: {
      index: paragraph.position?.index || 0,
      start: parseInt(position?.[0] || ''),
      end: parseInt(position?.[1] || ''),
      page_number: paragraph.position?.page_number,
      start_seconds: paragraph.position?.start_seconds,
      end_seconds: paragraph.position?.end_seconds,
    },
    fuzzy_result: false,
    page_with_visual: false,
    is_a_table: false,
    reference: '',
  };
}
