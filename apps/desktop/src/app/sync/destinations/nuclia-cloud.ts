import { INuclia, Nuclia, NucliaOptions, WritableKnowledgeBox } from '@nuclia/core';
import { catchError, from, map, Observable, of, switchMap } from 'rxjs';
import {
  ConnectorParameters,
  ConnectorSettings,
  DestinationConnectorDefinition,
  Field,
  IDestinationConnector,
} from '../models';
import { lookup } from 'mime-types';
import { sha256 } from '../../utils';

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

  upload(
    originalId: string,
    filename: string,
    params: ConnectorParameters,
    data: { blob?: Blob; metadata?: any },
  ): Observable<void> {
    if (params && params['kb'] && data.blob) {
      const blob = data.blob;
      const kb$ = this.kb
        ? of(this.kb)
        : this.nuclia.db.getKnowledgeBox(localStorage.getItem(ACCOUNT_KEY) || '', params['kb']);
      return kb$.pipe(
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

  uploadLink(
    filename: string,
    params: ConnectorParameters,
    data: { uri: string; extra_headers: { [key: string]: string } },
  ): Observable<void> {
    if (params && params['kb']) {
      const kb$ = this.kb
        ? of(this.kb)
        : this.nuclia.db.getKnowledgeBox(localStorage.getItem(ACCOUNT_KEY) || '', params['kb']);
      return kb$.pipe(
        switchMap((kb) => kb.createResource({ title: filename, files: { [filename]: { file: data } } })),
        map(() => undefined),
      );
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
        required: true,
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
