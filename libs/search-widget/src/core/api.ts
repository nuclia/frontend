import {
  Chat,
  Classification,
  FieldFullId,
  IErrorResponse,
  IResource,
  KBStates,
  LabelSets,
  Nuclia,
  NucliaOptions,
  Resource,
  ResourceField,
  ResourceFieldProperties,
  ResourceProperties,
  Search,
  SearchOptions,
} from '@nuclia/core';
import { Observable, from, switchMap } from 'rxjs';
import { filter, forkJoin, map, merge, of, take, tap } from 'rxjs';
import type { EntityGroup, WidgetOptions } from './models';
import { generatedEntitiesColor, getCDN } from './utils';
import { _ } from './i18n';
import { suggestionError } from './stores/suggestions.store';
import { NucliaPrediction } from '@nuclia/prediction';
import { searchError, searchOptions } from './stores/search.store';
import { hasViewerSearchError } from './stores/viewer-search.store';

let nucliaApi: Nuclia | null;
let nucliaPrediction: NucliaPrediction | null;
let STATE: KBStates;
let SEARCH_MODE = [Search.Features.PARAGRAPH, Search.Features.VECTOR];

const NUA_KEY =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Im51YSJ9.eyJpc3MiOiJodHRwczovL251Y2xpYS5jbG91ZC8iLCJleHAiOjI1MzM3MDc2NDgwMCwiaWF0IjoxNjgzMTAzMzEzLCJzdWIiOiJjNDQzNmEyNC04MzU4LTQ1NzItOTQzZi02NDg5YzQwNjBlYTciLCJqdGkiOiIyM2FmNGM1MS1iOWJlLTQyNGMtOGY0Zi1jYzA3MTRlZjhkZjAiLCJrZXkiOiIxMTViZDkzMi00Mjc5LTRhYWItOWNmOS1lZDBlN2NkNzAyYTIifQ.OLdhOXZE1fwwfyTEQHvlbe3RTd7HsRpXapXmJyBczTIKe7J-sRpcoTQB-hcBcX-ijVLCNNrhE5wtW9vx_mWGDHOPrwyBOb_mI1y8DWWnK6JeeuuFUPT7avtrO-SVnPCsh99VaJ9axH-RMCuQO1S7nHTugX8kHyGgfwIQGbDKhi-ODQNSik1ZOZaLh1NzncitTHMBUpaC4TYAus5bBEEncoqXRfzkgYHgMQ9utEPF4lrnPX2ToTlJFKgQkT2MG1CV4J1frNd-T7KoRw-gP7J2OgWTm0-KTAo-MZD6uWXpwVhWubrK80bFLDsfn3EcsGYnor3I2Yk4QcjtO0TUoCSa2nXQ2o6NV-8h2wDof5xrIpDno3w3EZ-tFNwCc3KSR0nuwUz3wdEepPXiK3-Jxtcau1TiJg6mvpUKjRkxu0WhLsCE3e2WiXcpjMWyxENIk8A5wxSGy2Yg8cGTxyIE2EKhdNkEkwQSwvg6ko_IR7DwgWGdtvaIGSgTfbXV15MbZq__RCc6Jq-BdHa_7RCtzQcJ5dQD7UPqRP3vFfJAIdJ8B5tyJ4BGSQ-3QzFez-okzxt0sZjTNk3ILqygOr59M1pUHWHqCOrPjBtB4VyRVxA6qDJ5mAolJgk6-Lov-Bhrni4ZZSsf_UD2V12vvHbtr8dHk5mQJJq9nmytU5w92ng6RGY';

export const TERRORISM_CLAUSES = ['LMA5219', 'LMA5390', 'LMA9184', 'NMA2918', 'NMA2919', 'NMA2920', 'NMA464'];

export const initNuclia = (options: NucliaOptions, state: KBStates, widgetOptions: WidgetOptions) => {
  if (nucliaApi) {
    throw new Error('Cannot exist more than one Nuclia widget at the same time');
  }
  if (widgetOptions.fuzzyOnly) {
    SEARCH_MODE = [Search.Features.PARAGRAPH];
  }
  nucliaApi = new Nuclia(options);
  searchOptions.set({ inTitleOnly: false, highlight: widgetOptions.highlight });
  if (widgetOptions.features?.suggestLabels) {
    const kbPath = nucliaApi?.knowledgeBox.fullpath;
    if (kbPath) {
      nucliaPrediction = new NucliaPrediction(getCDN());
      const authHeaders = state === 'PRIVATE' ? nucliaApi.auth.getAuthHeaders() : {};
      nucliaPrediction.loadModels(kbPath, authHeaders);
    }
  }
  if (widgetOptions.features?.relations && !SEARCH_MODE.includes(Search.Features.RELATIONS)) {
    SEARCH_MODE.push(Search.Features.RELATIONS);
  }
  STATE = state;
};

export const resetNuclia = () => {
  nucliaApi = null;
};

export const search = (query: string, options: SearchOptions): Observable<Search.FindResults> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }

  return nucliaApi.knowledgeBox.find(query, SEARCH_MODE, { page_size: 100, ...options }).pipe(
    filter((res) => {
      if (res.type === 'error') {
        searchError.set(res);
      }
      return res.type === 'findResults';
    }),
    map((res) => res as Search.FindResults),
  );
};

// export const search = (query: string, options: SearchOptions): Observable<Search.FindResults> => {
//   if (!nucliaApi) {
//     throw new Error('Nuclia API not initialized');
//   }

//   return nucliaApi.knowledgeBox.search(query, SEARCH_MODE, { page_size: 100, ...options }).pipe(
//     filter((res) => {
//       if (res.type === 'error') {
//         searchError.set(res);
//       }
//       return res.type === 'searchResults';
//     }),
//     map((res) => res as Search.Results),
//     map((res) => mapSearch2Find(res)),
//   );
// };

export const getAnswer = (query: string, chat?: Chat.Entry[], filters?: string[]) => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  const context = chat?.reduce((acc, curr) => {
    acc.push({ author: Chat.Author.USER, text: curr.question });
    acc.push({ author: Chat.Author.NUCLIA, text: curr.answer.text });
    return acc;
  }, [] as Chat.ContextEntry[]);

  return nucliaApi.knowledgeBox.chat(query, context, [Chat.Features.PARAGRAPHS], { filters });
};

export const sendFeedback = (answer: Chat.Answer, approved: boolean) => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.knowledgeBox.feedback(answer.id, approved);
};

export const searchInResource = (
  query: string,
  resource: IResource,
  options: SearchOptions,
  features: Search.ResourceFeatures[] = [Search.ResourceFeatures.PARAGRAPH],
): Observable<Search.Results> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  if (!query) {
    options.inTitleOnly = true;
  }
  return nucliaApi.knowledgeBox
    .getResourceFromData(resource)
    .search(query, features, options)
    .pipe(
      filter((res) => {
        if (res.type === 'error') {
          hasViewerSearchError.set(true);
        }
        return res.type === 'searchResults';
      }),
      map((res) => res as Search.Results),
    );
};

export const suggest = (query: string) => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }

  return nucliaApi.knowledgeBox.suggest(query, true).pipe(
    filter((res) => {
      if (res.type === 'error') {
        suggestionError.set(res);
      }
      return res.type === 'suggestions';
    }),
  );
};

export const predict = (query: string): Observable<Classification[]> => {
  if (!nucliaPrediction) {
    throw new Error('Nuclia prediction not initialized');
  }

  return nucliaPrediction.predict(query);
};

export const getResource = (uid: string): Observable<Resource> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return merge(getResourceById(uid, [ResourceProperties.BASIC, ResourceProperties.ORIGIN]), getResourceById(uid));
};

export const getResourceById = (uid: string, show?: ResourceProperties[]): Observable<Resource> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return merge(nucliaApi.knowledgeBox.getResource(uid, show));
};

export function getResourceField(fullFieldId: FieldFullId, valueOnly = false): Observable<ResourceField> {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.knowledgeBox
    .getResourceFromData({ id: fullFieldId.resourceId })
    .getField(
      fullFieldId.field_type,
      fullFieldId.field_id,
      valueOnly ? [ResourceFieldProperties.VALUE] : [ResourceFieldProperties.VALUE, ResourceFieldProperties.EXTRACTED],
    );
}

let _entities: EntityGroup[] | undefined = undefined;
export const loadEntities = (): Observable<EntityGroup[]> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  if (!_entities) {
    return forkJoin([nucliaApi.knowledgeBox.getEntities(), _.pipe(take(1))]).pipe(
      map(([entityMap, translate]) =>
        Object.entries(entityMap)
          .map(([groupId, group]) => ({
            id: groupId,
            title: group.title || `entities.${groupId.toLowerCase()}`,
            color: group.color || generatedEntitiesColor[groupId],
            entities: Object.entries(group.entities)
              .map(([, entity]) => entity.value)
              .sort((a, b) => a.localeCompare(b)),
            custom: group.custom,
          }))
          .sort((a, b) => translate(a.title).localeCompare(translate(b.title))),
      ),
      tap((entities) => (_entities = entities || [])),
    );
  } else {
    return of(_entities as EntityGroup[]);
  }
};

export const getLabelSets = (): Observable<LabelSets> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.knowledgeBox.getLabels();
};

export const getFile = (path: string): Observable<string> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.rest.getObjectURL(path);
};

export const getRegionalBackend = () => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.options.standalone ? `${nucliaApi.options.backend}/v1` : nucliaApi.regionalBackend + '/v1';
};

export const getTempToken = (): Observable<string> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.knowledgeBox.getTempToken();
};

export function getPdfSrc(path: string): string | { url: string; httpHeaders: any } {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.options.standalone ? { url: path, httpHeaders: { 'X-NUCLIADB-ROLES': 'READER' } } : path;
}

export const isPrivateKnowledgeBox = (): boolean => {
  return STATE === 'PRIVATE';
};

export const hasAuthData = (): boolean => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return !!nucliaApi.options?.apiKey || !!nucliaApi.auth.getToken();
};

export const getFileUrls = (paths: string[], inline = false): Observable<string[]> => {
  const doesNotNeedToken = paths.length === 0 || !isPrivateKnowledgeBox();
  return (doesNotNeedToken ? of('') : getTempToken()).pipe(
    map((token) =>
      paths.map((path) => {
        if (path.startsWith('/')) {
          const params = (token ? `eph-token=${token}` : '') + (inline ? `inline=true` : '');
          const fullpath = `${getRegionalBackend()}${path}`;
          return params ? `${fullpath}?${params}` : fullpath;
        } else {
          return path;
        }
      }),
    ),
  );
};

export const getFileUrl = (path?: string): Observable<string> =>
  path ? getFileUrls([path]).pipe(map((urls) => urls[0])) : of('');

export function getTextFile(path: string): Observable<string> {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.rest.get<Response>(path, {}, true).pipe(switchMap((res) => from(res.text())));
}

// CUSTOM BRITINSURANCE
export function fullLoad(): Observable<any> {
  return from(fetch('/full-data.json').then((res) => res.json()));
  // if (!nucliaApi) {
  //   throw new Error('Nuclia API not initialized');
  // }
  // return nucliaApi.knowledgeBox
  //   .catalog('', {
  //     page_size: 100,
  //     show: [ResourceProperties.BASIC, ResourceProperties.VALUES],
  //   })
  //   .pipe(
  //     map((res) => Object.keys((res as Search.Results)?.resources || {})),
  //     switchMap((res) =>
  //       forkJoin(
  //         res.map((uid) =>
  //           (nucliaApi!.knowledgeBox as any).getRawResource(uid, [ResourceProperties.BASIC, ResourceProperties.VALUES]),
  //         ),
  //       ),
  //     ),
  //   );
}

export const clauseSearch = (query: string, options?: SearchOptions): Observable<Search.FindResults> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }

  return nucliaApi.knowledgeBox
    .search(query, [Search.Features.DOCUMENT], {
      page_size: 100,
      show: [ResourceProperties.BASIC, ResourceProperties.VALUES],
      ...(options || {}),
    })
    .pipe(
      map((results) => {
        const res = results as Search.Results;
        return mapSearch2Find(res);
      }),
    );
};

export const facetByClause = (): Observable<Search.FacetsResult> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }

  return nucliaApi.knowledgeBox
    .search('', SEARCH_MODE, {
      page_size: 0,
      show: [],
      faceted: ['/l/fake'],
    })
    .pipe(map((results) => (results as Search.Results).paragraphs?.facets || {}));
};

export function getLabelledClause(label: string) {
  return search('', {
    filters: [label],
    show: [ResourceProperties.BASIC, ResourceProperties.VALUES, ResourceProperties.ORIGIN],
  });
}

const CLEANUP = new RegExp(/[^a-zA-Z0-9\s]+/g);
const TRIM = new RegExp(/\s\s+/g);

export function getMatchingClause(clause: string) {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  clause = clause.replace(CLEANUP, ' ').replace(TRIM, ' ').trim();
  console.log('getMatchingClause', clause);
  const approxWordCount = clause.split(' ').length;
  const exactMatchScore = approxWordCount * 1.2;

  return forkJoin([
    nucliaApi.knowledgeBox.search(clause, [Search.Features.DOCUMENT], {}),
    nucliaApi.knowledgeBox.search(clause, [Search.Features.VECTOR], {}),
  ]).pipe(
    map(([bm25, vector]) => {
      const bm25results = bm25 as Search.Results;
      const exact = bm25results.fulltext?.results.filter((p) => p.score >= exactMatchScore) || [];
      const close = bm25results.fulltext?.results.filter((p) => p.score < exactMatchScore) || [];
      const modified = (vector as Search.Results).sentences?.results || [];
      return { exact, close, modified };
    }),
  );
}

export const CLAUSES: { [ref: string]: string } = {
  NMA464: `Notwithstanding anything to the contrary contained herein this Certificate does not cover Loss or Damage directly or indirectly occasioned by, happening through or in consequence of war, invasion, acts of foreign enemies, hostilities (whether war be declared or not), civil war, rebellion, revolution, insurrection, military or usurped power or confiscation or nationalisation or requisition or destruction of or damage to property by or under the order of any government or public or local authority`,
};

function mapSearch2Find(res: Search.Results): Search.FindResults {
  return {
    ...res,
    type: 'findResults',
    next_page: false,
    total: res.fulltext?.results.length || 0,
    page_number: 0,
    page_size: 100,
    query: 'N/A',
    resources: Object.entries(res.resources || {}).reduce((acc, [id, resource]) => {
      acc[id] = {
        ...resource,
        fields: Object.keys(resource.data?.files || {}).reduce((acc, fieldId) => {
          acc[fieldId] = {
            paragraphs: {
              '0': {
                order: 0,
                score: 1,
                score_type: Search.FindScoreType.BOTH,
                text: 'N/A',
                id: '0',
                labels: [],
                position: {
                  index: 0,
                  start: 0,
                  end: 0,
                },
              },
            },
          };
          return acc;
        }, {} as { [id: string]: Search.FindField }),
      };
      return acc;
    }, {} as { [id: string]: Search.FindResource }),
  };
}
