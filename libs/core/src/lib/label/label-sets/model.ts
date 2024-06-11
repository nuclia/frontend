import { Label, LabelSet, LabelSetKind } from '@nuclia/core';
import { LABEL_MAIN_COLORS } from './utils';
import { cloneDeep } from '../../utils/clonedeep';

export const EMPTY_LABEL_SET: LabelSet = {
  title: '',
  color: LABEL_MAIN_COLORS[0],
  multiple: true,
  kind: [],
  labels: [],
};

export type LabelSetCounts = {
  [LabelSetKind.RESOURCES]: number;
  [LabelSetKind.PARAGRAPHS]: number;
};

export interface LabelSetDisplay extends LabelSet {
  id: string;
}

export class MutableLabelSet {
  title: string;
  color: string;
  multiple: boolean;
  kind: LabelSetKind[];
  labels?: Label[];

  constructor(labelSet: LabelSet) {
    // Enforce deep copy
    this.title = labelSet.title;
    this.color = labelSet.color;
    this.multiple = labelSet.multiple;
    this.kind = [...labelSet.kind];
    this.labels = labelSet.labels ? labelSet.labels.map((label) => cloneDeep(label)) : undefined;
  }

  getCopy(): LabelSet {
    return {
      title: this.title,
      color: this.color,
      multiple: this.multiple,
      kind: [...this.kind],
      labels: this.labels ? cloneDeep(this.labels) : [],
    };
  }

  isEqual(labelSet?: LabelSet): boolean {
    if (!labelSet) {
      return false;
    }
    return JSON.stringify(this.getCopy()) === JSON.stringify(labelSet);
  }
}
