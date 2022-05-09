import { INuclia, Nuclia, NucliaOptions } from '@nuclia/core';
import { map, Observable, of, switchMap } from 'rxjs';
import { IUploadConnector } from '../models';

export class NucliaKB implements IUploadConnector {
  nuclia: INuclia;

  constructor(data: NucliaOptions) {
    this.nuclia = new Nuclia(data);
    this.data = data;
  }
  authenticate(): Observable<boolean> {
    return of(true);
  }

  disconnect() {}

  upload(filename: string, blob: Blob): Observable<void> {
    return this.nuclia.db.getKnowledgeBox(this.data.account, this.data.kb).pipe(
      switchMap((kb) => kb.upload(new File([blob], filename))),
      map(() => undefined),
    );
  }
}
