import {
  FIELD_TYPE,
  INuclia,
  Nuclia,
  NucliaOptions,
  Resource,
  TextField,
  UploadResponse,
  WritableKnowledgeBox,
} from '../../../../../libs/sdk-core/src';
import { catchError, delay, map, Observable, of, switchMap, throwError } from 'rxjs';
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

  upload(
    originalId: string,
    filename: string,
    data: { buffer?: ArrayBuffer; text?: TextField; metadata?: any },
  ): Observable<boolean> {
    const slug = sha256(originalId);
    const text = data.text;
    const buffer = data.buffer;
    if (buffer || text) {
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
          if (buffer) {
            try {
              return resource
                .upload('file', buffer, false, {
                  contentType: data.metadata.mimeType || lookup(filename) || 'application/octet-stream',
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
          } else if (text) {
            try {
              return resource.setField(FIELD_TYPE.text, 'text', text).pipe(
                catchError((error: any) => {
                  console.error(`Problem adding ${filename} to ${slug}, status ${error}`);
                  return of(false);
                }),
                switchMap((res) => {
                  if (res) {
                    return of(true);
                  } else {
                    return this.deleteResource(slug, resource);
                  }
                }),
              );
            } catch (error) {
              console.error(`Error adding ${filename} to ${slug}, status ${error}`);
              return this.deleteResource(slug, resource);
            }
          } else {
            return of(false);
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

  uploadLink(originalId: string, filename: string, data: Link): Observable<void> {
    const slug = sha256(originalId);
    return this.getKb().pipe(
      switchMap((kb) =>
        kb.createOrUpdateResource({ title: filename, slug, files: { 'remote-file': { file: data } } }).pipe(
          catchError((error) => {
            console.log(`createOrUpdateResource – error:`, JSON.stringify(error));
            return throwError(() => new Error('Resource creation/modification failed'));
          }),
        ),
      ),
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
