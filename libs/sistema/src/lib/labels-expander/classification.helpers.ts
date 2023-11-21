import { Classification, LabelSets } from '@nuclia/core';

const SEPARATOR = '/';

export function getClassificationFromSelection(selection: { [id: string]: boolean }): Classification[] {
  return Object.entries(selection).reduce((selectedLabels, [id, selected]) => {
    if (selected) {
      selectedLabels.push(getLabelFromSelectionKey(id));
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
          (selection[getSelectionKey(key, label.title)] = !!labels.find(
            (item) => item.labelset === key && item.label === label.title,
          )),
      );
      return selection;
    },
    {} as { [id: string]: boolean },
  );
}

export function getSelectionKey(labelSet: string, label: string) {
  return `${labelSet}${SEPARATOR}${label}`;
}

export function getLabelFromSelectionKey(key: string): Classification {
  const [labelset, label] = key.split(SEPARATOR);
  return { label, labelset };
}
