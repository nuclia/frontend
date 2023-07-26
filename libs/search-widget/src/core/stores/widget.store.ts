import { writableSubject } from '../state-lib';
import { combineLatest, map } from 'rxjs';
import type { WidgetAction } from '../models';
import type { WidgetFeatures } from '@nuclia/core';

let widgetActions: WidgetAction[] = [];
export const setWidgetActions = (actions: WidgetAction[]) => {
  widgetActions = actions;
};
export const getWidgetActions = () => widgetActions;

export const widgetFeatures = writableSubject<WidgetFeatures | null>(null);
export const widgetPlaceholder = writableSubject<string>('input.placeholder');

export const navigateToLink = widgetFeatures.pipe(map((features) => !!features?.navigateToLink));
export const navigateToFile = widgetFeatures.pipe(map((features) => !!features?.navigateToFile));
export const hasFilterButton = widgetFeatures.pipe(map((features) => !!features?.filter));
export const isAnswerEnabled = widgetFeatures.pipe(map((features) => !!features?.answers));
export const isKnowledgeGraphEnabled = widgetFeatures.pipe(map((features) => !!features?.knowledgeGraph));
export const onlyAnswers = combineLatest([
  isAnswerEnabled,
  widgetFeatures.pipe(map((features) => !!features?.onlyAnswers)),
]).pipe(map(([answers, onlyAnswers]) => answers && onlyAnswers));
export const hideSources = combineLatest([
  isAnswerEnabled,
  widgetFeatures.pipe(map((features) => !!features?.hideSources)),
]).pipe(map(([answers, hideSources]) => answers && hideSources));

export const disableAnswers = () => {
  widgetFeatures.set({ ...(widgetFeatures.value || {}), answers: false });
};
