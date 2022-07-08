import { INuclia, Nuclia, NucliaOptions, WritableKnowledgeBox } from '@nuclia/core';
import { map, Observable, of, switchMap } from 'rxjs';
import {
  Field,
  IDestinationConnector,
  ConnectorSettings,
  DestinationConnectorDefinition,
  ConnectorParameters,
} from '../models';
const ACCOUNT_KEY = 'NUCLIA_ACCOUNT';

export const NucliaCloudKB: DestinationConnectorDefinition = {
  id: 'nucliacloud',
  title: 'Nuclia Cloud',
  description: 'Nuclia Cloud Knowledge Box',
  logo: 'assets/logos/nucliacloud.svg',
  factory: (data?: ConnectorSettings) => {
    const nuclia = new Nuclia({ ...data } as unknown as NucliaOptions);
    return of(new NucliaCloudKBImpl(nuclia));
  },
};
class NucliaCloudKBImpl implements IDestinationConnector {
  nuclia: INuclia;
  kb?: WritableKnowledgeBox;

  constructor(nuclia: INuclia) {
    this.nuclia = nuclia;
  }

  getParameters(): Observable<Field[]> {
    return this.nuclia.db.getKnowledgeBoxes(localStorage.getItem(ACCOUNT_KEY) || '').pipe(
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

  upload(filename: string, blob: Blob, params?: ConnectorParameters): Observable<void> {
    if (params && params['kb']) {
      const kb$ = this.kb
        ? of(this.kb)
        : this.nuclia.db.getKnowledgeBox(localStorage.getItem(ACCOUNT_KEY) || '', params['kb']);
      return kb$.pipe(switchMap((kb) => kb.upload(new File([blob], filename), true).pipe(map(() => undefined))));
    } else {
      return of();
    }
  }
}
