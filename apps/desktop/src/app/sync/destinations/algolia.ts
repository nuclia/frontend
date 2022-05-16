import { map, Observable, of } from 'rxjs';
import {
  Field,
  IDestinationConnector,
  ConnectorSettings,
  ConnectorDefinition,
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
  constructor() {}

  getParameters(): Observable<Field[]> {
    return of([
      {
        id: 'key',
        label: 'API key',
        type: 'text',
      },
    ]);
  }

  authenticate(): Observable<boolean> {
    return of(true);
  }

  upload(filename: string, blob: Blob, params?: ConnectorParameters): Observable<void> {
    return of();
  }
}
