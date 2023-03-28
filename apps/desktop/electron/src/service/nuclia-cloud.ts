import { INuclia, Nuclia, NucliaOptions, WritableKnowledgeBox } from '../../../../../libs/sdk-core/src';
import { catchError, from, map, Observable, of, switchMap } from 'rxjs';
import { lookup } from 'mime-types';
import { createHash } from 'node:crypto';

require('localstorage-polyfill');
require('isomorphic-unfetch');

function sha256(message: string): string {
  return createHash('sha256').update(message).digest('hex');
}
export class NucliaCloud {
  nuclia: INuclia;
  private kb: WritableKnowledgeBox;

  constructor(options: NucliaOptions) {
    this.nuclia = new Nuclia(options);
  }

  upload(originalId: string, filename: string, data: { blob?: Blob; metadata?: any }): Observable<void> {
    if (data.blob) {
      const blob = data.blob;
      const slug = sha256(originalId);
      return this.getKb().pipe(
        switchMap((kb) =>
          kb.getResourceBySlug(slug, [], []).pipe(
            catchError((error) => {
              if (error.status === 404) {
                console.log('not found');
                return kb
                  .createResource({ slug, title: filename }, true)
                  .pipe(map((data) => kb.getResourceFromData({ id: data.uuid })));
              } else {
                console.log('problme', slug, error.status);
                throw error;
              }
            }),
          ),
        ),
        switchMap((resource) =>
          resource
            .upload('file', new File([blob], filename), false, {
              contentType: lookup(filename) || 'application/octet-stream',
            })
            .pipe(
              catchError((error: any) => {
                console.error(error.toString());
                return resource.delete();
              }),
              switchMap((res) => {
                if (res && (res.failed || res.conflict)) {
                  return resource.delete();
                } else {
                  return of(undefined);
                }
              }),
            ),
        ),
        map(() => undefined),
      );
    } else {
      return of(undefined);
    }
  }

  uploadLink(filename: string, data: { uri: string; extra_headers: { [key: string]: string } }): Observable<void> {
    return this.getKb().pipe(
      switchMap((kb) => kb.createResource({ title: filename, files: { [filename]: { file: data } } })),
      map(() => undefined),
    );
  }

  private getKb(): Observable<WritableKnowledgeBox> {
    if (this.kb) {
      return of(this.kb);
    } else {
      return this.nuclia.db.getKnowledgeBox().pipe(
        map((kb) => {
          this.kb = kb;
          return kb;
        }),
      );
    }
  }
}
