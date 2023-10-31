import { writableSubject } from '../state-lib';
import { combineLatest, map, Observable } from 'rxjs';
import type { WidgetAction } from '../models';
import type { WidgetFeatures } from '@nuclia/core';

let widgetActions: WidgetAction[] = [];
export const setWidgetActions = (actions: WidgetAction[]) => {
  widgetActions = actions;
};
export const getWidgetActions = () => widgetActions;

export const widgetFeatures = writableSubject<WidgetFeatures | null>(null);
export const widgetPlaceholder = writableSubject<string>('input.placeholder');

export const navigateToLink: Observable<boolean> = widgetFeatures.pipe(map((features) => !!features?.navigateToLink));
export const targetNewTab: Observable<boolean> = widgetFeatures.pipe(map((features) => !!features?.targetNewTab));
export const navigateToFile: Observable<boolean> = widgetFeatures.pipe(map((features) => !!features?.navigateToFile));
export const hasFilterButton: Observable<boolean> = widgetFeatures.pipe(map((features) => !!features?.filter));
export const isAnswerEnabled: Observable<boolean> = widgetFeatures.pipe(map((features) => !!features?.answers));
export const isKnowledgeGraphEnabled: Observable<boolean> = widgetFeatures.pipe(
  map((features) => !!features?.knowledgeGraph),
);
export const suggestEntities: Observable<boolean> = widgetFeatures.pipe(map((features) => !!features?.suggestEntities));
export const displayMetadata: Observable<boolean> = widgetFeatures.pipe(map((features) => !!features?.displayMetadata));
export const hideThumbnails: Observable<boolean> = widgetFeatures.pipe(map((features) => !!features?.hideThumbnails));
export const hideLogo: Observable<boolean> = widgetFeatures.pipe(map((features) => !!features?.hideLogo));
export const filterByLabelFamily: Observable<boolean> = widgetFeatures.pipe(
  map((features) => !!features?.filterByLabelFamily),
);
export const onlyAnswers: Observable<boolean> = combineLatest([
  isAnswerEnabled,
  widgetFeatures.pipe(map((features) => !!features?.onlyAnswers)),
]).pipe(map(([answers, onlyAnswers]) => answers && onlyAnswers));
export const hideSources: Observable<boolean> = combineLatest([
  isAnswerEnabled,
  widgetFeatures.pipe(map((features) => !!features?.hideSources)),
]).pipe(map(([answers, hideSources]) => answers && hideSources));

export const disableAnswers = () => {
  widgetFeatures.set({ ...(widgetFeatures.value || {}), answers: false });
};
