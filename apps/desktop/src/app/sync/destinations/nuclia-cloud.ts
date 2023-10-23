import { Account, IKnowledgeBoxItem, INuclia, Nuclia, NucliaOptions, WritableKnowledgeBox } from '@nuclia/core';
import { map, Observable, of } from 'rxjs';
import {
  baseLogoPath,
  ConnectorSettings,
  DestinationConnectorDefinition,
  Field,
  IDestinationConnector,
} from '../models';
import { ACCOUNT_KEY } from '../sync.service';

export const NucliaCloudKB: DestinationConnectorDefinition = {
  id: 'nucliacloud',
  title: 'Nuclia Cloud',
  description: 'Nuclia Cloud Knowledge Box',
  logo: `${baseLogoPath}/nucliacloud.svg`,
  factory: (data?: ConnectorSettings) => {
    const nuclia = new Nuclia({ ...data } as unknown as NucliaOptions);
    return of(new NucliaCloudKBImpl(nuclia));
  },
};

class NucliaCloudKBImpl implements IDestinationConnector {
  nuclia: INuclia;
  kbs: { [slug: string]: WritableKnowledgeBox } = {};
  account?: Account;

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

  private getKbField(): Observable<Field> {
    const request: Observable<IKnowledgeBoxItem[]> = this.nuclia.options.standalone
      ? this.nuclia.db.getStandaloneKbs().pipe(
          map((kbs) =>
            kbs.map((kb) => ({
              id: kb.uuid,
              zone: '',
              slug: kb.slug,
              title: kb.slug,
              role_on_kb: 'SOWNER',
            })),
          ),
        )
      : this.nuclia.db.getKnowledgeBoxes(localStorage.getItem(ACCOUNT_KEY) || '');
    return request.pipe(
      map((kbs) => ({
        id: 'kb',
        label: 'Knowledge Box',
        type: 'select',
        required: true,
        canBeRefreshed: true,
        options: kbs
          .filter((kb) => !!kb.slug)
          .map((kb) => {
            const id = kb.id || '';
            return {
              label: kb.title || id,
              value: id,
              disabled: kb.role_on_kb === 'SMEMBER',
            };
          }),
      })),
    );
  }
}
