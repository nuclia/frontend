import { writableSubject } from '../state-lib';
import { combineLatest, map } from 'rxjs';
import type { WidgetAction } from '../models';
import type { WidgetFeatures } from '@nuclia/core';

export type WidgetMode = 'popup' | 'embedded';

let widgetActions: WidgetAction[] = [];
export const setWidgetActions = (actions: WidgetAction[]) => {
  widgetActions = actions;
};
export const getWidgetActions = () => widgetActions;

export const widgetMode = writableSubject<WidgetMode | null>(null);
export const widgetFeatures = writableSubject<WidgetFeatures | null>(null);
export const widgetPlaceholder = writableSubject<string>('input.placeholder');
export const widgetType = writableSubject<'search' | 'viewer' | null>(null);

export const canAnnotateEntities = widgetFeatures.pipe(map((features) => !!features?.entityAnnotation));
export const canEditLabels = widgetFeatures.pipe(map((features) => !!features?.editLabels));
export const navigateToLink = widgetFeatures.pipe(map((features) => !!features?.navigateToLink));
export const navigateToFile = widgetFeatures.pipe(map((features) => !!features?.navigateToFile));
export const hasFilterButton = widgetFeatures.pipe(map((features) => !!features?.filter));
export const isAnswerEnabled = widgetFeatures.pipe(map((features) => !!features?.answers));
export const isSpeechEnabled = widgetFeatures.pipe(map((features) => !!features?.speech));
export const isKnowledgeGraphEnabled = widgetFeatures.pipe(map((features) => !!features?.knowledgeGraph));
export const onlyAnswers = combineLatest([
  isAnswerEnabled,
  widgetFeatures.pipe(map((features) => !!features?.onlyAnswers)),
]).pipe(map(([answers, onlyAnswers]) => answers && onlyAnswers));
