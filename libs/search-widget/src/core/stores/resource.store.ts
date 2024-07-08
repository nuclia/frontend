import { writableSubject } from '../state-lib';
import type { CloudLink, LinkFieldData, Resource } from '@nuclia/core';
import { map, Observable, of, switchMap } from 'rxjs';
import { getFileUrls } from '../api';
import { isYoutubeUrl } from '../utils';

export const resource = writableSubject<Resource | null>(null);

export const resourceHasEntities = resource.pipe(
  map((resource) => (!resource ? false : Object.entries(resource.getAnnotatedEntities()).length > 0)),
);

export const resourceLabels = resource.pipe(map((resource) => (!resource ? [] : resource.getClassifications())));

export const summaries: Observable<string[]> = resource.pipe(
  map((resource) => {
    if (!resource) {
      return [];
    } else if (resource.summary) {
      return [resource.summary].concat(resource.getExtractedSummaries());
    } else {
      return resource.getExtractedSummaries();
    }
  }),
  map((summaries) => summaries.filter((summary) => !!summary)),
);

export const files: Observable<string[]> = resource.pipe(
  switchMap((resource) =>
    !resource
      ? of([])
      : getFileUrls(resource.getFiles().reduce((acc, f) => (f.uri ? acc.concat(f.uri) : acc), [] as string[])),
  ),
);

export const links: Observable<string[]> = resource.pipe(
  map((resource) =>
    !resource
      ? []
      : (resource
          .getFields(['links'])
          .map((field) => (field as LinkFieldData).value?.uri)
          .filter((uri) => !!uri) as string[]),
  ),
);

export const previewLinks: Observable<CloudLink[]> = resource.pipe(
  map((resource) =>
    !resource
      ? []
      : (resource
          .getFields(['links'])
          .filter((field) => !isYoutubeField(field as LinkFieldData))
          .map((field) => (field as LinkFieldData).extracted?.link?.link_preview)
          .filter((preview) => !!preview) as CloudLink[]),
  ),
);

function isYoutubeField(field: LinkFieldData): boolean {
  return field.value?.uri ? isYoutubeUrl(field.value.uri) : false;
}
