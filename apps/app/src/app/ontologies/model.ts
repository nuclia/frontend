import { cloneDeep } from '@flaps/common';
import { Label, LabelSet, LabelSetKind } from '@nuclia/core';
import { LABEL_MAIN_COLORS } from './utils';

export const EMTPY_LABEL_SET: LabelSet = {
  title: '',
  color: LABEL_MAIN_COLORS[0],
  multiple: true,
  kind: [],
  labels: [],
};

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

  getLabel(labelTitle: string): Label | undefined {
    return (this.labels || []).find((label) => label.title === labelTitle);
  }

  addLabel(title: string): void {
    const newLabel = {
      title: title,
    };
    if (this.labels) {
      this.labels.push(newLabel);
    } else {
      this.labels = [newLabel];
    }
  }

  modifyLabel(labelTitle: string, changes: Partial<Label>): void {
    const index = this.getLabelIndex(labelTitle);
    if (index >= 0) {
      this.labels![index] = { ...this.labels![index], ...changes };
    }
  }

  deleteLabel(labelTitle: string): void {
    this.labels = this.labels?.filter((label) => label.title !== labelTitle);
  }

  setLabelOrder(labelTitles: string[]) {
    this.labels?.sort((a: Label, b: Label) => {
      const aIndex = labelTitles.indexOf(a.title);
      const bIndex = labelTitles.indexOf(b.title);
      return aIndex - bIndex;
    });
  }

  private getLabelIndex(labelTitle: string): number {
    return (this.labels || []).findIndex((label) => label.title === labelTitle);
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
}
