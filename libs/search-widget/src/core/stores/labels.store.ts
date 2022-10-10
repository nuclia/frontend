import type { LabelSets } from '@nuclia/core';
import { SvelteState } from '../state-lib';

interface LabelState {
  labelSets: LabelSets;
}

export const labelState = new SvelteState<LabelState>({
  labelSets: {},
});

export const labelSets = labelState.writer<LabelSets>(
  (state) => state.labelSets,
  (state, labelSets) => ({
    ...state,
    labelSets,
  }),
);
