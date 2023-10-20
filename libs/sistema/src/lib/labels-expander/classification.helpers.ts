import { Classification, LabelSets } from '@nuclia/core';

export function getClassificationFromSelection(selection: { [id: string]: boolean }): Classification[] {
  return Object.entries(selection).reduce((selectedLabels, [id, selected]) => {
    if (selected) {
      const [labelset, label] = id.split('_');
      selectedLabels.push({ label, labelset });
    }
    return selectedLabels;
  }, [] as Classification[]);
}

export function getSelectionFromClassification(
  labelSets: LabelSets,
  labels: Classification[],
): { [id: string]: boolean } {
  return Object.entries(labelSets).reduce(
    (selection, [key, item]) => {
      item.labels.forEach(
        (label) =>
          (selection[`${key}_${label.title}`] = !!labels.find(
            (item) => item.labelset === key && item.label === label.title,
          )),
      );
      return selection;
    },
    {} as { [id: string]: boolean },
  );
}
