import { map, Observable, of } from 'rxjs';
import { Field, IDestinationConnector, ConnectorSettings } from '../models';

export class Algolia implements IDestinationConnector {
  id = 'algolia';
  title = 'Algolia';
  description = 'Algolia index';
  logo = '';

  constructor() {}

  init(settings?: ConnectorSettings): Observable<boolean> {
    return of(true);
  }

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

  upload(filename: string, blob: Blob): Observable<void> {
    return of();
  }
}
