import { INuclia, Nuclia, NucliaOptions, WritableKnowledgeBox } from '@nuclia/core';
import { map, Observable, of, switchMap } from 'rxjs';
import { IUploadConnector, IUploadConnectorSettings } from '../models';

export interface NucliaCloudSettings extends IUploadConnectorSettings {
  kb: string;
}

export class NucliaCloudKB implements IUploadConnector<NucliaCloudSettings> {
  nuclia: INuclia;
  kbSlug?: string;
  kb?: WritableKnowledgeBox;

  constructor(data: NucliaOptions) {
    this.nuclia = new Nuclia(data);
  }

  init(settings: NucliaCloudSettings): Observable<boolean> {
    this.kbSlug = settings.kb;
    return this.nuclia.db.getKnowledgeBox(this.nuclia.options.account || '', this.kbSlug).pipe(
      map((kb) => {
        this.kb = kb;
        return true;
      }),
    );
  }

  authenticate(): Observable<boolean> {
    return of(true);
  }

  upload(filename: string, blob: Blob): Observable<void> {
    if (this.kbSlug && this.kb) {
      return this.kb.upload(new File([blob], filename)).pipe(map(() => undefined));
    } else {
      return of();
    }
  }
}
