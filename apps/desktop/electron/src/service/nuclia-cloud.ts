import {
  INuclia,
  Nuclia,
  NucliaOptions,
  Resource,
  UploadResponse,
  WritableKnowledgeBox,
} from '../../../../../libs/sdk-core/src';
import { catchError, delay, map, Observable, of, switchMap } from 'rxjs';
import { lookup } from 'mime-types';
import { createHash } from 'node:crypto';
import { Link } from './models';

require('localstorage-polyfill');

function sha256(message: string): string {
  return createHash('sha256').update(message).digest('hex');
}
export class NucliaCloud {
  nuclia: INuclia;
  private kb: WritableKnowledgeBox;

  constructor(options: NucliaOptions) {
    this.nuclia = new Nuclia(options);
  }

  upload(originalId: string, filename: string, data: { buffer?: ArrayBuffer; metadata?: any }): Observable<boolean> {
    if (data.buffer) {
      const buffer = data.buffer;
      const slug = sha256(originalId);
      return this.getKb().pipe(
        switchMap((kb) =>
          kb.getResourceBySlug(slug, [], []).pipe(
            catchError((error) => {
              if (error.status === 404) {
                return kb
                  .createResource({ slug, title: filename }, true)
                  .pipe(map((data) => kb.getResourceFromData({ id: data.uuid })));
              } else {
                console.error(`Problem creating ${slug}, status ${error.status}`);
                return of(undefined);
              }
            }),
          ),
        ),
        delay(500),
        switchMap((resource) => {
          if (!resource) {
            return of(false);
          }
          try {
            return resource
              .upload('file', buffer, false, {
                contentType: lookup(filename) || 'application/octet-stream',
                filename,
              })
              .pipe(
                catchError((error: any) => {
                  console.error(`Problem uploading ${filename} to ${slug}, status ${error}`);
                  return of(false);
                }),
                switchMap((res) => {
                  if (res && (res as UploadResponse).completed) {
                    return of(true);
                  } else {
                    return this.deleteResource(slug, resource);
                  }
                }),
              );
          } catch (error) {
            console.error(`Error uploading ${filename} to ${slug}, status ${error}`);
            return this.deleteResource(slug, resource);
          }
        }),
      );
    } else {
      return of(false);
    }
  }

  private deleteResource(slug: string, resource: Resource): Observable<false> {
    try {
      return resource.delete().pipe(map(() => false));
    } catch (error) {
      console.error(`Problem deleting ${slug}, status ${error}`);
      return of(false);
    }
  }

  uploadLink(filename: string, data: Link): Observable<void> {
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
