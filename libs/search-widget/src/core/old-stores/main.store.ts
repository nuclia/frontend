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
import type { Classification, IResource, Search, SearchOptions } from '@nuclia/core';
import { getFilterFromLabel } from '@nuclia/core';

type NucliaStore = {
  query: BehaviorSubject<string>;
  filters: BehaviorSubject<string[]>;
  searchOptions: BehaviorSubject<SearchOptions>;
  searchResults: BehaviorSubject<Search.Results | typeof PENDING_RESULTS>;
  triggerSearch: Subject<void>;
  hasSearchError: ReplaySubject<boolean>;
  displayedResource: BehaviorSubject<DisplayedResource>;
};
let _store: NucliaStore | undefined;

let _state: {
  query: Observable<string>;
  filters: Observable<string[]>;
  searchOptions: Observable<SearchOptions>;
  results: Observable<IResource[]>;
  smartResults: Observable<Search.SmartResult[]>;
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
      filters: new BehaviorSubject<string[]>([]),
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
      filters: _store.filters.asObservable(),
      searchOptions: _store.searchOptions.asObservable(),
      results: _store.searchResults.pipe(
        filter((res) => !!res.resources),
        map((results) => getSortedResources(results)),
        startWith([] as IResource[]),
      ),
      smartResults: _store.searchResults.pipe(
        filter((res) => !!res.resources),
        map((results) => {
          const allResources = results.resources;
          if (!allResources || Object.keys(allResources).length === 0) {
            return [] as Search.SmartResult[];
          }
          const fullTextResults =
            results.fulltext?.results.map((res) => allResources[res.rid]).filter((res) => !!res) || [];
          const semanticResults = results.sentences?.results || [];
          let smartResults: Search.SmartResult[] = [];

          // best fulltext match goes first
          if (fullTextResults.length > 0) {
            smartResults.push(fullTextResults[0]);
          }

          // if not a keyword search, add the 2 best semantic sentences
          const looksLikeKeywordSearch = _store!.query.value.split(' ').length < 3;
          if (!looksLikeKeywordSearch) {
            const twoBestSemantic = semanticResults.slice(0, 2);
            twoBestSemantic.forEach((sentence) => {
              const resource = allResources[sentence.rid];
              if (resource) {
                smartResults = addParagraphToSmartResults(
                  smartResults,
                  resource,
                  generateFakeParagraphForSentence(allResources, sentence),
                );
              }
            });
          }

          // add the rest of the fulltext results
          smartResults = [...smartResults, ...fullTextResults];

          // put the paragraphs in each resource
          results.paragraphs?.results?.forEach((paragraph) => {
            const resource = allResources[paragraph.rid];
            if (resource) {
              smartResults = addParagraphToSmartResults(smartResults, resource, paragraph);
            }
          });

          // for resources without paragraphs, create a fake one using summary if it exists (else, remove the resource)
          smartResults = smartResults
            .map((resource) => {
              if (resource.paragraphs && resource.paragraphs.length > 0) {
                return resource;
              } else {
                const summaryParagraph = generateFakeParagraphForSummary(resource);
                if (summaryParagraph) {
                  return { ...resource, paragraphs: [summaryParagraph] };
                } else {
                  return undefined;
                }
              }
            })
            .filter((r) => !!r) as Search.SmartResult[];

          return smartResults;
        }),
        startWith([] as IResource[]),
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

export const addLabelFilter = (label: Classification) => {
  const filter = getFilterFromLabel(label);
  const currentFilters = nucliaStore().filters.value;
  if (!currentFilters.includes(filter)) {
    nucliaStore().filters.next(currentFilters.concat([filter]));
  }
};

export const removeLabelFilter = (label: Classification) => {
  const filter = getFilterFromLabel(label);
  const currentFilters = nucliaStore().filters.value;
  nucliaStore().filters.next(currentFilters.filter((f) => f !== filter));
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

function addParagraphToSmartResults(
  smartResults: Search.SmartResult[],
  resource: Search.SmartResult,
  paragraph: Search.Paragraph | undefined,
): Search.SmartResult[] {
  if (!paragraph) {
    return smartResults;
  }
  const existing = smartResults.find((r) => r.id === resource.id);
  if (existing) {
    existing.paragraphs = existing.paragraphs || [];
    existing.paragraphs.push(paragraph);
  } else {
    smartResults.push({ ...resource, paragraphs: [paragraph] });
  }
  return smartResults;
}

function generateFakeParagraphForSentence(
  resources: { [id: string]: IResource },
  sentence: Search.Sentence | undefined,
): Search.SmartParagraph | undefined {
  if (!sentence) {
    return undefined;
  }
  const resource = resources[sentence.rid];
  return resource
    ? {
        score: 0,
        rid: resource.id,
        field_type: sentence.field_type,
        field: sentence.field,
        text: sentence.text,
        labels: [],
        sentences: [sentence],
      }
    : undefined;
}

function generateFakeParagraphForSummary(resource: IResource): Search.SmartParagraph | undefined {
  return resource.summary
    ? {
        score: 0,
        rid: resource.id,
        field_type: 'a',
        field: '',
        text: resource.summary,
        labels: [],
      }
    : undefined;
}
