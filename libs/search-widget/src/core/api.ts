import {
  Chat,
  Classification,
  FieldFullId,
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
import { filter, forkJoin, from, map, merge, Observable, of, switchMap, take, tap } from 'rxjs';
import type { EntityGroup, WidgetOptions } from './models';
import { generatedEntitiesColor, getCDN } from './utils';
import { _ } from './i18n';
import { suggestionError } from './stores/suggestions.store';
import { NucliaPrediction } from '@nuclia/prediction';
import { searchError, searchOptions } from './stores/search.store';
import { hasViewerSearchError } from './stores/viewer-search.store';
import FindScoreType = Search.FindScoreType;

let nucliaApi: Nuclia | null;
let nucliaPrediction: NucliaPrediction | null;
let STATE: KBStates;
let SEARCH_MODE = [Search.Features.PARAGRAPH, Search.Features.VECTOR];

const NUA_KEY =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Im51YSJ9.eyJpc3MiOiJodHRwczovL251Y2xpYS5jbG91ZC8iLCJleHAiOjI1MzM3MDc2NDgwMCwiaWF0IjoxNjgzMTAzMzEzLCJzdWIiOiJjNDQzNmEyNC04MzU4LTQ1NzItOTQzZi02NDg5YzQwNjBlYTciLCJqdGkiOiIyM2FmNGM1MS1iOWJlLTQyNGMtOGY0Zi1jYzA3MTRlZjhkZjAiLCJrZXkiOiIxMTViZDkzMi00Mjc5LTRhYWItOWNmOS1lZDBlN2NkNzAyYTIifQ.OLdhOXZE1fwwfyTEQHvlbe3RTd7HsRpXapXmJyBczTIKe7J-sRpcoTQB-hcBcX-ijVLCNNrhE5wtW9vx_mWGDHOPrwyBOb_mI1y8DWWnK6JeeuuFUPT7avtrO-SVnPCsh99VaJ9axH-RMCuQO1S7nHTugX8kHyGgfwIQGbDKhi-ODQNSik1ZOZaLh1NzncitTHMBUpaC4TYAus5bBEEncoqXRfzkgYHgMQ9utEPF4lrnPX2ToTlJFKgQkT2MG1CV4J1frNd-T7KoRw-gP7J2OgWTm0-KTAo-MZD6uWXpwVhWubrK80bFLDsfn3EcsGYnor3I2Yk4QcjtO0TUoCSa2nXQ2o6NV-8h2wDof5xrIpDno3w3EZ-tFNwCc3KSR0nuwUz3wdEepPXiK3-Jxtcau1TiJg6mvpUKjRkxu0WhLsCE3e2WiXcpjMWyxENIk8A5wxSGy2Yg8cGTxyIE2EKhdNkEkwQSwvg6ko_IR7DwgWGdtvaIGSgTfbXV15MbZq__RCc6Jq-BdHa_7RCtzQcJ5dQD7UPqRP3vFfJAIdJ8B5tyJ4BGSQ-3QzFez-okzxt0sZjTNk3ILqygOr59M1pUHWHqCOrPjBtB4VyRVxA6qDJ5mAolJgk6-Lov-Bhrni4ZZSsf_UD2V12vvHbtr8dHk5mQJJq9nmytU5w92ng6RGY';

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
  return from(fetch('/full-data.3.json').then((res) => res.json()));
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

export function mapResourceListToFindResults(data: Resource[], clauseIds?: string[]): Search.FindResults {
  const findResults: Search.FindResults = {
    query: '',
    type: 'findResults',
    next_page: false,
    total: data.length,
    page_size: data.length,
    page_number: 1,
  };
  findResults.resources = data.reduce((resources, resource) => {
    const fields: { [id: string]: Search.FindField } = {};
    if (resource.data.files) {
      const fileFieldId = `/f/${Object.keys(resource.data.files)[0]}`;
      fields[fileFieldId] = {
        paragraphs: resource.data?.texts
          ? Object.entries(resource.data.texts)
              .filter((entry) => !clauseIds || clauseIds.includes(entry[0]))
              .reduce((paragraphs, [labelId, paragraph], index) => {
                const paragraphId = `${resource.id}${fileFieldId}/0-${index}`;
                paragraphs[paragraphId] = {
                  order: 1,
                  id: paragraphId,
                  labels: [labelId],
                  text: paragraph.extracted?.text?.text || '',
                  score: 1,
                  score_type: FindScoreType.BOTH,
                  position: {
                    index: 0,
                    start: 0,
                    end: 0,
                  },
                };
                return paragraphs;
              }, {} as { [id: string]: Search.FindParagraph })
          : {},
      };
    }
    resources[resource.id] = {
      ...resource,
      fields,
    };
    return resources;
  }, {} as { [id: string]: Search.FindResource });
  return findResults;
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

export function getMatchingClause(clauseId: string, clause: string) {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  clause = clause.replace(CLEANUP, ' ').replace(TRIM, ' ').trim();
  const approxWordCount = clause.split(' ').length;
  const exactMatchScore = approxWordCount;
  const closeMatchScore = exactMatchScore * 0.9;

  return forkJoin([
    nucliaApi.knowledgeBox.search(clause, [Search.Features.PARAGRAPH], {
      filters: [`/l/clauses/${clauseId}`],
      fields: ['t'],
      page_size: 100,
    }),
    nucliaApi.knowledgeBox.search('', [Search.Features.PARAGRAPH], {
      filters: [`/l/clauses/${clauseId}`],
      fields: ['t'],
      page_size: 100,
    }),
  ]).pipe(
    map(([bm25, all]) => {
      const bm25results = bm25 as Search.Results;
      const maxScore = bm25results.paragraphs?.results.reduce((max, p) => Math.max(max, p.score), 0) || 0;
      const exactMatchThreshold = Math.max(exactMatchScore, maxScore * 0.97);
      console.log('exactMatchThreshold', exactMatchThreshold);
      const exact = bm25results.paragraphs?.results.filter((p) => p.score >= exactMatchThreshold) || [];
      const closeMatchThreshold = Math.max(closeMatchScore, maxScore * 0.9);
      const close =
        bm25results.paragraphs?.results.filter(
          (p) => p.score < exactMatchThreshold && p.score >= closeMatchThreshold,
        ) || [];
      const modified = bm25results.paragraphs?.results.filter((p) => p.score < closeMatchThreshold) || [];
      const bm25matches = bm25results.paragraphs?.results.map((p) => p.rid) || [];
      const notMatching =
        (all as Search.Results).sentences?.results.filter((item) => !bm25matches.includes(item.rid)) || [];
      return { exact, close, modified: [...modified, ...notMatching] };
    }),
  );
}

export const CLAUSES: { [ref: string]: string } = {
  LMA5219: `It is agreed that in the event of the failure of the Underwriters hereon to pay any amount claimed to be due hereunder, the Underwriters hereon, at the request of the Insured (or Reinsured), will submit to the jurisdiction of a Court of competent jurisdiction within the United States. Nothing in this Clause constitutes or should be understood to constitute a waiver of Underwriters' rights to commence an action in any Court of competent jurisdiction in the United States, to remove an action to a United States District Court, or to seek a transfer of a case to another Court as permitted by the laws of the United States or of any State in the United States.`,
  NMA0464: `Notwithstanding anything to the contrary contained herein this Certificate does not cover Loss or Damage directly or indirectly occasioned by, happening through or in consequence of war, invasion, acts of foreign enemies, hostilities (whether war be declared or not), civil war, rebellion, revolution, insurrection, military or usurped power or confiscation or nationalisation or requisition or destruction of or damage to property by or under the order of any government or public or local authority`,
  LMA5390: `It is hereby noted that the Underwriters have made available coverage for “insured losses” directly resulting from an "act of terrorism" as defined in the "U.S. Terrorism Risk Insurance Act of 2002", as amended (“TRIA”) and the Insured has declined or not confirmed to purchase this coverage. This Insurance therefore affords no coverage for losses directly resulting from any "act of terrorism" as defined in TRIA except to the extent, if any, otherwise provided by this policy. All other terms, conditions, insured coverage and exclusions of this Insurance including applicable limits and deductibles remain unchanged and apply in full force and effect to the coverage provided by this Insurance.`,
  LMA9184: `You are hereby notified that under the Terrorism Risk Insurance Act of 2002, as amended ("TRIA"), that you now have a right to purchase insurance coverage for losses arising out of acts of terrorism, as defined in Section 102(1) of the Act, as amended: The term “act of terrorism” means any act that is certified by the Secretary of the Treasury, in consultation with the Secretary of Homeland Security and the Attorney General of the United States, to be an act of terrorism; to be a violent act or an act that is dangerous to human life, property, or infrastructure; to have resulted in damage within the United States, or outside the United States in the case of an air carrier or vessel or the premises of a United States mission; and to have been committed by an individual or individuals, as part of an effort to coerce the civilian population of the United States or to influence the policy or affect the conduct of the United States Government by coercion. Any coverage you purchase for "acts of terrorism" shall expire at 12:00 midnight December 31, 2027, the date on which the TRIA Program is scheduled to terminate, or the expiry date of the policy whichever occurs first, and shall not cover any losses or events which arise after the earlier of these dates.`,
  NMA2918: `Notwithstanding any provision to the contrary within this insurance or any endorsement thereto it is agreed that this insurance excludes loss, damage, cost or expense of whatsoever nature directly or indirectly caused by, resulting from or in connection with any of the following regardless of any other cause or event contributing concurrently or in any other sequence to the loss;
  1. war, invasion, acts of foreign enemies, hostilities or warlike operations (whether war be declared or
  not), civil war, rebellion, revolution, insurrection, civil commotion assuming the proportions of or
  amounting to an uprising, military or usurped power; or
  2. any act of terrorism.
  For the purpose of this endorsement an act of terrorism means an act, including but not limited to the
  use of force or violence and/or the threat thereof, of any person or group(s) of persons, whether acting
  alone or on behalf of or in connection with any organisation(s) or government(s), committed for political,
  religious, ideological or similar purposes including the intention to influence any government and/or to
  put the public, or any section of the public, in fear.`,
  NMA2919: `It is hereby noted that the Underwriters have made available coverage for “insured losses”
  directly resulting from an "act of terrorism" as defined in the "U.S. Terrorism Risk Insurance Act
  of 2002", as amended (“TRIA”) and the Insured has declined or not confirmed to purchase this
  coverage.
  This Insurance therefore affords no coverage for losses directly resulting from any "act of
  terrorism" as defined in TRIA except to the extent, if any, otherwise provided by this policy.
  All other terms, conditions, insured coverage and exclusions of this Insurance including
  applicable limits and deductibles remain unchanged and apply in full force and effect to the
  coverage provided by this Insurance`,
  NMA2920: `Notwithstanding any provision to the contrary within this insurance or any endorsement thereto it is agreed that this insurance excludes loss, damage, cost or expense of whatsoever nature directly or indirectly caused by, resulting from or in connection with any act of terrorism regardless of any other cause or event contributing concurrently or in any other sequence to the loss. For the purpose of this endorsement an act of terrorism means an act, including but not limited to the use of force or violence and/or the threat thereof, of any person or group(s) of persons, whether acting alone or on behalf of or in connection with any organisation(s) or government(s), committed for political, religious, ideological or similar purposes including the intention to influence any government and/or to put the public, or any section of the public, in fear. This endorsement also excludes loss, damage, cost or expense of whatsoever nature directly or indirectly caused by, resulting from or in connection with any action taken in controlling, preventing, suppressing or in any way relating to any act of terrorism. If the Underwriters allege that by reason of this exclusion, any loss, damage, cost or expense is not covered by this insurance the burden of proving the contrary shall be upon the Assured. In the event any portion of this endorsement is found to be invalid or unenforceable, the remainder shall remain in full force and effect.`,
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

export function findClauses(data: Resource[], clauses: string[], without = false): Search.FindResults {
  console.log(
    'noField',
    data.filter((res) => !res.data?.texts).map((res) => res.id),
  );
  const res = data.filter((resource) => {
    const resourceClauses = Object.keys(resource.data?.texts || {});
    return without
      ? !resourceClauses.some((clause) => clauses.includes(clause))
      : resourceClauses.some((clause) => clauses.includes(clause));
  });
  return mapResourceListToFindResults(res, without ? undefined : clauses);
}
