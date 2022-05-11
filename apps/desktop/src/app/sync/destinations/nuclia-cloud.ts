import { INuclia, Nuclia, NucliaOptions, WritableKnowledgeBox } from '@nuclia/core';
import { map, Observable, of, switchMap } from 'rxjs';
import { Field, IDestinationConnector, ConnectorSettings } from '../models';

export class NucliaCloudKB implements IDestinationConnector {
  id = 'nucliacloud';
  title = 'Nuclia Cloud';
  description = 'Nuclia Cloud Knowledge Box';
  logo = '';

  nuclia: INuclia;
  kbSlug?: string;
  kb?: WritableKnowledgeBox;

  constructor(data: NucliaOptions) {
    this.nuclia = new Nuclia(data);
  }

  init(settings?: ConnectorSettings): Observable<boolean> {
    if (!settings) {
      return of(true);
    }
    this.kbSlug = settings['kb'];
    return this.nuclia.db.getKnowledgeBox(this.nuclia.options.account || '', this.kbSlug).pipe(
      map((kb) => {
        this.kb = kb;
        return true;
      }),
    );
  }

  getParameters(): Observable<Field[]> {
    return this.nuclia.db.getKnowledgeBoxes(this.nuclia.options.account || '').pipe(
      map((kbs) => [
        {
          id: 'kb',
          label: 'Knowledge Box',
          type: 'select',
          options: kbs.filter((kb) => !!kb.slug).map((kb) => ({ label: kb.title || kb.slug!, value: kb.slug! })),
        },
      ]),
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
