import { NO_RESULTS, PENDING_RESULTS } from './models';
import type { Intents, WidgetAction, DisplayedResource } from './models';
import {
  BehaviorSubject,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  ReplaySubject,
  startWith,
  Subject,
  tap,
} from 'rxjs';
import type { IResource, Search, Widget } from '@nuclia/core';

let widgetActions: WidgetAction[] = [];
export const setWidgetActions = (actions: WidgetAction[]) => {
  widgetActions = actions;
};
export const getWidgetActions = () => widgetActions;

type NucliaStore = {
  query: BehaviorSubject<string>;
  intents: BehaviorSubject<Intents>;
  suggestions: BehaviorSubject<Search.Results>;
  searchResults: BehaviorSubject<Search.Results | typeof PENDING_RESULTS>;
  triggerSearch: Subject<void>;
  hasSearchError: ReplaySubject<boolean>;
  widget: ReplaySubject<Widget>;
  displayedResource: BehaviorSubject<DisplayedResource>;
};
let _store: NucliaStore | undefined;

let _state: {
  query: Observable<string>;
  results: Observable<IResource[]>;
  labelIntents: Observable<string[]>;
  paragraphs: Observable<Search.Paragraph[]>;
  hasSearchError: Observable<boolean>;
  pendingSuggestions: Observable<boolean>;
  pendingResults: Observable<boolean>;
  widget: Observable<Widget>;
  customStyle: Observable<string>;
  displayedResource: Observable<DisplayedResource>;
  getMatchingParagraphs: (resId: string) => Observable<Search.Paragraph[]>;
  getMatchingSentences: (resId: string) => Observable<Search.Sentence[]>;
};

export const nucliaStore = (): NucliaStore => {
  if (!_store) {
    _store = {
      query: new BehaviorSubject(''),
      intents: new BehaviorSubject({}),
      suggestions: new BehaviorSubject(NO_RESULTS),
      searchResults: new BehaviorSubject(NO_RESULTS),
      triggerSearch: new Subject(),
      hasSearchError: new ReplaySubject(1),
      widget: new ReplaySubject(1),
      displayedResource: new BehaviorSubject({ uid: '' }),
    };
    _state = {
      query: _store!.query.asObservable().pipe(
        tap(() => _store!.hasSearchError.next(false)),
        distinctUntilChanged(),
      ),
      results: _store!.searchResults.pipe(
        filter((res) => !!res.resources),
        map((results) => getSortedResources(results)),
        startWith([] as IResource[]),
      ),
      paragraphs: _store!.suggestions.pipe(
        filter((res) => !!res.paragraphs?.results),
        map((res) => Object.values(res.paragraphs?.results || [])),
        startWith([] as Search.Paragraph[]),
      ),
      labelIntents: _store!.intents.pipe(map((intents) => intents.labels || [])),
      hasSearchError: _store!.hasSearchError.asObservable(),
      pendingSuggestions: _store!.suggestions.pipe(map((res) => (res as typeof PENDING_RESULTS).pending)),
      pendingResults: _store!.searchResults.pipe(map((res) => (res as typeof PENDING_RESULTS).pending)),
      widget: _store!.widget.asObservable(),
      customStyle: _store!.widget.pipe(
        map((widget) =>
          Object.entries(widget?.style || {})
            .filter(([k, v]) => !!v)
            .reduce((acc, [k, v]) => `${acc}--custom-${k}: ${v};`, ''),
        ),
      ),
      displayedResource: _store!.displayedResource.asObservable(),
      getMatchingParagraphs: (resId: string): Observable<Search.Paragraph[]> => {
        return _store!.searchResults.pipe(
          map((results) => results.paragraphs?.results || []),
          map((paragraphs) => paragraphs.filter((p) => p.rid === resId)),
          map((paragraphs) => paragraphs.slice().sort((a, b) => b.score - a.score)),
        );
      },
      getMatchingSentences: (resId: string): Observable<Search.Sentence[]> => {
        return _store!.searchResults.pipe(
          map((results) => results.sentences?.results || []),
          map((sentences) => sentences.filter((p) => p.rid === resId)),
          map((sentences) => sentences.slice().sort((a, b) => b.score - a.score)),
        );
      },
    };
  }
  return _store as NucliaStore;
};

export const nucliaState = () => {
  nucliaStore();
  return _state;
};

export const resetStore = () => {
  Object.values(nucliaStore()).forEach((s) => s.complete());
  _store = undefined;
};

export const setDisplayedResource = (resource: DisplayedResource) => {
  nucliaStore().displayedResource.next(resource);
  nucliaStore().suggestions.next(NO_RESULTS);
  nucliaStore().intents.next({});
};

const getSortedResources = (results: Search.Results) => {
  return Object.values(results.resources || {})
    .map((res) => {
      let score = 0;
      // if resource appears in both paragraphs and sentences, it should be displayed first
      // then we consider the sentences highest score
      // and if no sentence match, we default to paragraphs highest score
      if ((results.sentences?.results || []).find((p) => p.rid === res.id)) {
        score += 100;
        if ((results.paragraphs?.results || []).find((p) => p.rid === res.id)) {
          score += 100;
        }
        score += Math.max(
          ...(results.sentences?.results || []).filter((p) => p.rid === res.id).map((res) => res.score),
        );
      } else {
        score += Math.max(
          ...(results.paragraphs?.results || []).filter((p) => p.rid === res.id).map((res) => res.score),
        );
      }
      return { res: res, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((data) => data.res);
};
