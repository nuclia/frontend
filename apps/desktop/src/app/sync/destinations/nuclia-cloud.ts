import { Account, INuclia, Nuclia, NucliaOptions, WritableKnowledgeBox } from '@nuclia/core';
import { catchError, from, map, Observable, of, switchMap, tap } from 'rxjs';
import {
  ConnectorParameters,
  ConnectorSettings,
  DestinationConnectorDefinition,
  Field,
  IDestinationConnector,
} from '../models';
import { lookup } from 'mime-types';
import { sha256 } from '../../utils';
import { ACCOUNT_KEY } from '../sync.service';

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

  upload(
    originalId: string,
    filename: string,
    params: ConnectorParameters,
    data: { blob?: Blob; metadata?: any },
  ): Observable<void> {
    if (params && params['kb'] && data.blob) {
      const blob = data.blob;
      const mimetype = lookup(filename) || 'application/octet-stream';
      return this.getAccount().pipe(
        tap((account) => {
          const applicableLimit = this.isMedia(mimetype)
            ? account.limits.upload.upload_limit_max_media_file_size
            : account.limits.upload.upload_limit_max_non_media_file_size;
          if (blob.size > applicableLimit) {
            console.error(`File too large. Size=${blob.size}, limit=${applicableLimit}`);
            throw new Error(`File "${filename}" is too large.`);
          }
        }),
        switchMap(() => this.getKb(params['kb'])),
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
                contentType: mimetype,
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
      return this.getKb(params['kb']).pipe(
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

  private getKb(slug: string): Observable<WritableKnowledgeBox> {
    if (!this.kbs[slug]) {
      return this.nuclia.db
        .getKnowledgeBox(localStorage.getItem(ACCOUNT_KEY) || '', slug)
        .pipe(tap((kb) => (this.kbs[slug] = kb)));
    } else {
      return of(this.kbs[slug]);
    }
  }

  private getAccount(): Observable<Account> {
    if (!this.account) {
      return this.nuclia.db
        .getAccount(localStorage.getItem(ACCOUNT_KEY) || '')
        .pipe(tap((account) => (this.account = account)));
    } else {
      return of(this.account);
    }
  }

  private isMedia(mimetype: string): boolean {
    return mimetype.startsWith('image/') || mimetype.startsWith('video/') || mimetype.startsWith('audio/');
  }
}
