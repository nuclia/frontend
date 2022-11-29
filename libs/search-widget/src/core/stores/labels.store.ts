import type { LabelSet, LabelSets } from '@nuclia/core';
import { SvelteState } from '../state-lib';

interface LabelState {
  labelSets: LabelSets;
}

export interface LabelSetWithId extends LabelSet {
  id: string;
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

export const orderedLabelSetList = labelState.reader<LabelSetWithId[]>((state) =>
  Object.entries(state.labelSets)
    .map(([id, set]) => ({ ...set, id }))
    .sort((labelSetA, labelSetB) => labelSetA.title.localeCompare(labelSetB.title)),
);
