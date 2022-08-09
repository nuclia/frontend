import { INuclia, Nuclia, NucliaOptions, WritableKnowledgeBox } from '@nuclia/core';
import { map, Observable, of, switchMap } from 'rxjs';
import {
  ConnectorParameters,
  ConnectorSettings,
  DestinationConnectorDefinition,
  Field,
  IDestinationConnector,
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

  refreshField(fieldId: string): Observable<Field | undefined> {
    switch (fieldId) {
      case 'kb':
        return this.getKbField();
      default:
        return of(undefined);
    }
  }

  getParameters(): Observable<Field[]> {
    return this.getKbField().pipe(map((kbField) => [kbField]));
  }

  authenticate(): Observable<boolean> {
    return of(true);
  }

  upload(filename: string, params: ConnectorParameters, data: { blob?: Blob; metadata?: any }): Observable<void> {
    if (params && params['kb'] && data.blob) {
      const blob = data.blob;
      const kb$ = this.kb
        ? of(this.kb)
        : this.nuclia.db.getKnowledgeBox(localStorage.getItem(ACCOUNT_KEY) || '', params['kb']);
      return kb$.pipe(switchMap((kb) => kb.upload(new File([blob], filename)).pipe(map(() => undefined))));
    } else {
      return of(undefined);
    }
  }

  private getKbField(): Observable<Field> {
    return this.nuclia.db.getKnowledgeBoxes(localStorage.getItem(ACCOUNT_KEY) || '').pipe(
      map((kbs) => ({
        id: 'kb',
        label: 'Knowledge Box',
        type: 'select',
        canBeRefreshed: true,
        options: kbs
          .filter((kb) => !!kb.slug)
          .map((kb) => {
            const slug = kb.slug || '';
            return {
              label: kb.title || slug,
              value: slug,
              disabled: kb.role_on_kb === 'SMEMBER',
            };
          }),
      })),
    );
  }
}
