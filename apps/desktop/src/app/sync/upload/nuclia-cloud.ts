import { INuclia, Nuclia, NucliaOptions } from '@nuclia/core';
import { map, Observable, of, switchMap } from 'rxjs';
import { IUploadConnector, IUploadConnectorSettings } from '../models';

export interface NucliaCloudSettings extends IUploadConnectorSettings {
  kb: string;
}

export class NucliaCloudKB implements IUploadConnector<NucliaCloudSettings> {
  nuclia: INuclia;
  kbSlug?: string;

  constructor(data: NucliaOptions) {
    this.nuclia = new Nuclia(data);
  }

  init(settings: NucliaCloudSettings) {
    this.kbSlug = settings.kb;
  }

  authenticate(): Observable<boolean> {
    return of(true);
  }

  disconnect() {}

  upload(filename: string, blob: Blob): Observable<void> {
    if (this.kbSlug && this.nuclia.options.account) {
      return this.nuclia.db.getKnowledgeBox(this.nuclia.options.account, this.kbSlug).pipe(
        switchMap((kb) => kb.upload(new File([blob], filename))),
        map(() => undefined),
      );
    } else {
      return of();
    }
  }
}
