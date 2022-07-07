import { Observable, of } from 'rxjs';
import {
  Field,
  IDestinationConnector,
  ConnectorSettings,
  DestinationConnectorDefinition,
  ConnectorParameters,
} from '../models';

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
        id: 'apiKey',
        label: 'Algolia API Key',
        type: 'text',
      },
      {
        id: 'appKId',
        label: 'Algolia Application Id',
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
    // TODO: integrate algolia js client
    //  https://www.algolia.com/doc/api-client/getting-started/install/javascript/?client=javascript
    console.log(filename, params, data);
    return of();
  }
}
