import { writableSubject } from '../state-lib';
import type { CloudLink, FieldId, LinkFieldData, Resource, ResourceData } from '@nuclia/core';
import type { FileFieldData } from '@nuclia/core';
import { FIELD_TYPE, getDataKeyFromFieldType } from '@nuclia/core';
import { filter, map, Observable, of, switchMap, take } from 'rxjs';
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

export function getFieldUrl(field: FieldId): Observable<string> {
  return resource.pipe(
    filter((resource) => !!resource && Object.keys(resource.data).length > 0),
    take(1),
    switchMap((resource) => {
      const dataKeyFromFieldType = getDataKeyFromFieldType(field.field_type) as keyof ResourceData;
      const fieldData = (resource as Resource).getFieldData(dataKeyFromFieldType, field.field_id);
      if (field.field_type === FIELD_TYPE.file) {
        const uri = (fieldData as FileFieldData)?.value?.file?.uri;
        return uri ? getFileUrls([uri]) : of(['']);
      } else if (field.field_type === FIELD_TYPE.link) {
        return of([(fieldData as LinkFieldData)?.value?.uri || '']);
      }
      return of(['']);
    }),
    map((url) => url[0]),
  );
}
