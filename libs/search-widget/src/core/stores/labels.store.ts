import {
  getFilterFromLabelSet,
  getLabelFromFilter,
  type FieldFilterExpression,
  type FilterExpression,
  type LabelSet,
  type LabelSets,
  type ParagraphFilterExpression,
  type Search,
} from '@nuclia/core';
import { SvelteState } from '../state-lib';
import { getLabelFacets } from '..';

interface LabelState {
  labelSets: LabelSets;
  facets: Search.FacetsResult;
}

export interface LabelSetWithId extends LabelSet {
  id: string;
}

export const labelState = new SvelteState<LabelState>({
  labelSets: {},
  facets: {},
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

export const labelFacets = labelState.writer<Search.FacetsResult>(
  (state) => state.facets,
  (state, facets) => ({
    ...state,
    facets,
  }),
);

export function loadLabelFacets(labelSet: string) {
  getLabelFacets(labelSet).subscribe((facets) => {
    // Simplify facets keys
    const newFacets = {
      [labelSet]: Object.fromEntries(
        Object.entries(facets[getFilterFromLabelSet(labelSet)]).map(([key, count]) => [
          getLabelFromFilter(key).label,
          count,
        ]),
      ),
    };
    labelFacets.set({ ...labelFacets.getValue(), ...newFacets });
  });
}

export function getLabelsInPrefilters(filterExpression: FilterExpression) {
  const labels = (filterExpression.field ? getLabelsFromFilterExpression(filterExpression.field) : []).concat(
    filterExpression.paragraph ? getLabelsFromFilterExpression(filterExpression.paragraph) : [],
  );
  return {
    labelSets: labels.filter((filter) => filter.labelset && !filter.label).map((label) => label.labelset),
    labels: labels.filter((filter) => !!filter.label),
  };
}

function getLabelsFromFilterExpression(
  filterExpression: FieldFilterExpression | ParagraphFilterExpression,
): { labelset: string; label?: string }[] {
  if ('prop' in filterExpression) {
    if (filterExpression.prop === 'label') {
      const { prop, ...labelData } = filterExpression;
      return [labelData];
    } else {
      return [];
    }
  }
  let subExpressions: (FieldFilterExpression | ParagraphFilterExpression)[] = [];
  if ('and' in filterExpression) {
    subExpressions = subExpressions.concat(filterExpression.and);
  } else if ('or' in filterExpression) {
    subExpressions = subExpressions.concat(filterExpression.or);
  } else if ('not' in filterExpression) {
    subExpressions.push(filterExpression.not);
  }
  return subExpressions.map((subExpression) => getLabelsFromFilterExpression(subExpression)).flat();
}
