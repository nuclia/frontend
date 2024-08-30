import { writableSubject } from '../state-lib';
import { combineLatest, map, Observable } from 'rxjs';
import type { WidgetAction, WidgetFilters } from '../models';
import type { RAGImageStrategy, RAGStrategy, WidgetFeatures } from '@nuclia/core';

export const widgetFeatures = writableSubject<WidgetFeatures | null>(null);
export const widgetPlaceholder = writableSubject<string>('input.placeholder');
export const widgetFilters = writableSubject<WidgetFilters>({});
export const widgetRagStrategies = writableSubject<RAGStrategy[]>([]);
export const widgetImageRagStrategies = writableSubject<RAGImageStrategy[]>([]);
export const widgetJsonSchema = writableSubject<object | null>(null);
export const notEnoughDataMessage = writableSubject<string>('');
export const widgetActions = writableSubject<WidgetAction[]>([]);

export const navigateToLink: Observable<boolean> = widgetFeatures.pipe(map((features) => !!features?.navigateToLink));
export const navigateToFile: Observable<boolean> = widgetFeatures.pipe(map((features) => !!features?.navigateToFile));
export const openNewTab: Observable<boolean> = widgetFeatures.pipe(map((features) => !!features?.openNewTab));
export const hasFilterButton: Observable<boolean> = widgetFeatures.pipe(map((features) => !!features?.filter));
export const isAnswerEnabled: Observable<boolean> = widgetFeatures.pipe(map((features) => !!features?.answers));
export const isCitationsEnabled: Observable<boolean> = widgetFeatures.pipe(map((features) => !!features?.citations));
export const isKnowledgeGraphEnabled: Observable<boolean> = widgetFeatures.pipe(
  map((features) => !!features?.knowledgeGraph),
);
export const autocompleteFromNERs: Observable<boolean> = widgetFeatures.pipe(
  map((features) => !!features?.autocompleteFromNERs),
);
export const hasDumpLogButton: Observable<boolean> = widgetFeatures.pipe(map((features) => !!features?.dumpLog));
export const displayMetadata: Observable<boolean> = widgetFeatures.pipe(map((features) => !!features?.displayMetadata));
export const hideThumbnails: Observable<boolean> = widgetFeatures.pipe(map((features) => !!features?.hideThumbnails));
export const hideLogo: Observable<boolean> = widgetFeatures.pipe(map((features) => !!features?.hideLogo));
export const filterByLabels: Observable<boolean> = widgetFilters.pipe(map((filters) => !!filters?.labels));
export const filterByLabelFamilies: Observable<boolean> = widgetFilters.pipe(
  map((filters) => !!filters?.labelFamilies),
);
export const filterByCreatedDate: Observable<boolean> = widgetFilters.pipe(map((filters) => !!filters.created));
export const orFilterLogic: Observable<boolean> = widgetFeatures.pipe(map((features) => !!features?.orFilterLogic));
export const hideResults: Observable<boolean> = combineLatest([
  isAnswerEnabled,
  widgetFeatures.pipe(map((features) => !!features?.hideResults)),
]).pipe(map(([answers, hideResults]) => answers && hideResults));
export const displayFieldList: Observable<boolean> = widgetFeatures.pipe(
  map((features) => !!features?.displayFieldList),
);
export const preferMarkdown: Observable<boolean> = widgetFeatures.pipe(map((features) => !!features?.preferMarkdown));
export const jsonSchemaEnabled: Observable<boolean> = widgetJsonSchema.pipe(map((schema) => !!schema));
export const disableAnswers = () => {
  widgetFeatures.set({ ...(widgetFeatures.value || {}), answers: false });
};
