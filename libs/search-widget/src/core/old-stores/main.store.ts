import type { DisplayedResource } from '../models';
import { NO_RESULTS, PENDING_RESULTS } from '../models';
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
import type { IResource, Search, SearchOptions } from '@nuclia/core';

export interface SmartResult {
  resource: IResource;
  textElements?: { isSemanticMatch: boolean; text: string }[];
}

type NucliaStore = {
  query: BehaviorSubject<string>;
  searchOptions: BehaviorSubject<SearchOptions>;
  searchResults: BehaviorSubject<Search.Results | typeof PENDING_RESULTS>;
  triggerSearch: Subject<void>;
  hasSearchError: ReplaySubject<boolean>;
  displayedResource: BehaviorSubject<DisplayedResource>;
};
let _store: NucliaStore | undefined;

let _state: {
  query: Observable<string>;
  searchOptions: Observable<SearchOptions>;
  results: Observable<IResource[]>;
  smartResults: Observable<SmartResult[]>;
  hasSearchError: Observable<boolean>;
  pendingResults: Observable<boolean>;
  displayedResource: Observable<DisplayedResource>;
  getMatchingParagraphs: (resId: string) => Observable<Search.Paragraph[]>;
  getMatchingSentences: (resId: string) => Observable<Search.Sentence[]>;
};

export const nucliaStore = (): NucliaStore => {
  if (!_store) {
    _store = {
      query: new BehaviorSubject(''),
      searchOptions: new BehaviorSubject({ inTitleOnly: false, highlight: true } as SearchOptions),
      searchResults: new BehaviorSubject(NO_RESULTS),
      triggerSearch: new Subject(),
      hasSearchError: new ReplaySubject(1),
      displayedResource: new BehaviorSubject({ uid: '' }),
    };
    _state = {
      query: _store.query.asObservable().pipe(
        tap(() => _store!.hasSearchError.next(false)),
        distinctUntilChanged(),
      ),
      searchOptions: _store.searchOptions.asObservable(),
      results: _store.searchResults.pipe(
        filter((res) => !!res.resources),
        map((results) => getSortedResources(results)),
        startWith([] as IResource[]),
      ),
      smartResults: _store.searchResults.pipe(
        filter((res) => !!res.resources),
        map((results) => {
          if (!results.resources || Object.keys(results.resources).length === 0) {
            return [] as SmartResult[];
          }
          let smartResults: SmartResult[] = [];
          const fullTextResults = results.paragraphs?.results || [];
          const bestFullText = fullTextResults.shift();
          const ordered = [
            bestFullText,
            results.sentences?.results?.[0],
            results.sentences?.results?.[1],
            ...fullTextResults,
          ];
          ordered.forEach((element, i) => {
            if (element) {
              const resource = results.resources?.[element.rid];
              if (resource) {
                smartResults = addElementToSmartResults(smartResults, resource, element, i === 1 || i === 2);
              }
            }
          });
          console.log(smartResults);
          return smartResults;
        }),
        startWith([] as SmartResult[]),
      ),
      hasSearchError: _store.hasSearchError.asObservable(),
      pendingResults: _store.searchResults.pipe(map((res) => (res as typeof PENDING_RESULTS).pending)),
      displayedResource: _store.displayedResource.asObservable(),
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

function addElementToSmartResults(
  smartResults: SmartResult[],
  resource: IResource,
  element: Search.Sentence | Search.Paragraph,
  isSemanticMatch: boolean,
): SmartResult[] {
  const duplicate = smartResults.find(
    (r) => r.resource.id === resource.id && r.textElements?.find((el) => el.text === element.text),
  );
  if (duplicate) {
    return smartResults;
  }
  const existing = smartResults.find((r) => r.resource.id === resource.id);
  if (existing) {
    existing.textElements?.push({ isSemanticMatch, text: element.text });
  } else {
    smartResults.push({ resource, textElements: [{ isSemanticMatch, text: element.text }] });
  }
  return smartResults;
}
