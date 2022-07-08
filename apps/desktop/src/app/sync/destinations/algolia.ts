import { from, map, Observable, of, throwError } from 'rxjs';
import {
  Field,
  IDestinationConnector,
  ConnectorSettings,
  DestinationConnectorDefinition,
  ConnectorParameters,
} from '../models';
import algoliasearch from 'algoliasearch';

export const Algolia: DestinationConnectorDefinition = {
  id: 'algolia',
  title: 'Algolia',
  description: 'Algolia index',
  logo: 'assets/logos/algolia.svg',
  factory: (data?: ConnectorSettings) => of(new AlgoliaImpl()),
};
class AlgoliaImpl implements IDestinationConnector {
  getParameters(): Observable<Field[]> {
    return of([
      {
        id: 'appId',
        label: 'Algolia Application Id',
        type: 'text',
      },
      {
        id: 'apiKey',
        label: 'Algolia Admin API Key',
        type: 'text',
      },
      {
        id: 'index',
        label: 'Index name',
        type: 'text',
      },
    ]);
  }

  authenticate(): Observable<boolean> {
    return of(true);
  }

  upload(filename: string, params: ConnectorParameters, data: { blob?: Blob; metadata?: any }): Observable<void> {
    if (!!params.appId && !!params.apiKey && !!params.index && !!data.metadata) {
      const client = algoliasearch(params.appId, params.apiKey);
      const index = client.initIndex(params.index);
      const newObject = {
        objectID: data.metadata.uuid,
        title: filename,
        fullText: data.metadata.extractedText?.[0]?.body?.text,
        images: data.metadata.fileExtractedData?.[0]?.fileThumbnail?.uri,
      };
      return from(index.saveObject(newObject)).pipe(map(() => undefined));
    }
    return throwError(() => {
      return `Algolia upload requires:
        ${!params.appId ? 'an application id' : ''}
        ${!params.apiKey ? 'an api key' : ''}
        ${!params.index ? 'an index name' : ''}
        ${!data.metadata ? 'the file metadata' : ''}
      `;
    });
  }
}
