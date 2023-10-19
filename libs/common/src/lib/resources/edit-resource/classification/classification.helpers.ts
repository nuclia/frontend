import { Classification } from '@nuclia/core';

export function getClassificationFromSelection(selection: { [id: string]: boolean }): Classification[] {
  return Object.entries(selection).reduce((selectedLabels, [id, selected]) => {
    if (selected) {
      const [labelset, label] = id.split('_');
      selectedLabels.push({ label, labelset });
    }
    return selectedLabels;
  }, [] as Classification[]);
}
