import { INuclia, WritableKnowledgeBox } from '@nuclia/core';
import { catchError, from, map, Observable, of, switchMap } from 'rxjs';
import { lookup } from 'mime-types';
import { sha256 } from './utils';

export class NucliaCloud {
  nuclia: INuclia;
  private kb?: WritableKnowledgeBox;

  constructor(nuclia: INuclia) {
    this.nuclia = nuclia;
  }

  upload(originalId: string, filename: string, data: { blob?: Blob; metadata?: any }): Observable<void> {
    if (data.blob) {
      const blob = data.blob;
      return this.getKb().pipe(
        switchMap((kb) =>
          from(sha256(originalId)).pipe(
            switchMap((slug) =>
              kb.getResourceBySlug(slug, [], []).pipe(
                catchError((error) => {
                  if (error.status === 404) {
                    return kb
                      .createResource({ slug, title: filename }, true)
                      .pipe(map((data) => kb.getResourceFromData({ id: data.uuid })));
                  } else {
                    throw error;
                  }
                }),
              ),
            ),
            switchMap((resource) => {
              return resource.upload('file', new File([blob], filename), false, {
                contentType: lookup(filename) || 'application/octet-stream',
              });
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
