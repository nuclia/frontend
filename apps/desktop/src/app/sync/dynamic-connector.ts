import { ISourceConnector, SyncItem, SearchResults, Field, ConnectorParameters, FileStatus } from './models';
import { from, map, Observable, of } from 'rxjs';
import { defaultAuthCheck } from '../utils';

interface PromisedSyncItem {
  uuid: string;
  title: string;
  originalId: string;
  metadata?: { [key: string]: string };
}

interface PromisedSearchResults {
  items: PromisedSyncItem[];
  nextPage?: () => Promise<PromisedSearchResults>;
}

interface DynamicConnector {
  isExternal?: boolean;
  getParameters?(): Field[];
  handleParameters?(params: ConnectorParameters): void;
  goToOAuth?(reset?: boolean): void;
  authenticate?(): Promise<boolean>;
  getFiles(query?: string, pageSize?: number): Promise<PromisedSearchResults>;
  download?(resource: SyncItem): Promise<Blob>;
  getLink?(resource: SyncItem): Promise<{ uri: string; extra_headers: { [key: string]: string } }>;
}

export class DynamicConnectorWrapper implements ISourceConnector {
  hasServerSideAuth = false;
  isExternal = false;
  connector: DynamicConnector;

  constructor(connector: DynamicConnector) {
    this.connector = connector;
    this.isExternal = !!this.connector.isExternal;
  }

  getParameters(): Observable<Field[]> {
    if (this.connector.getParameters) {
      const fields = this.connector.getParameters();
      if (!Array.isArray(fields)) {
        throw new Error('getParameters must return an array of fields');
      } else if (fields.some((field) => !field.id || !field.label || !field.type)) {
        throw new Error('All fields must have an id, a label and a type');
      } else {
        return of(fields);
      }
    } else {
      return of([]);
    }
  }

  handleParameters(params: ConnectorParameters) {
    if (this.connector.handleParameters) {
      this.connector.handleParameters(params);
    }
  }

  getParametersValues(): ConnectorParameters {
    //TODO
    return {};
  }

  goToOAuth(reset?: boolean) {
    if (this.connector.goToOAuth) {
      this.connector.goToOAuth(reset);
    }
  }

  authenticate(): Observable<boolean> {
    if (this.connector.authenticate) {
      return from(this.connector.authenticate());
    } else {
      return of(true);
    }
  }

  getFiles(query?: string, pageSize?: number): Observable<SearchResults> {
    return from(this.connector.getFiles(query, pageSize)).pipe(map((results) => this.checkSearchResults(results)));
  }

  private checkSearchResults(results: any): SearchResults {
    if (!Array.isArray(results.items)) {
      throw new Error('getFiles items must ne an array of items');
    } else if (results.items.some((item: any) => !item.uuid || !item.title || !item.originalId)) {
      throw new Error('All items must have a uuid, a title, and an originalId');
    }
    return {
      items: results.items.map((item: any) => ({ ...item, status: FileStatus.PENDING, metadata: item.metadata || {} })),
      nextPage: results.nextPage
        ? from(results.nextPage()).pipe(map((res: any) => this.checkSearchResults(res)))
        : undefined,
    };
  }

  download(resource: SyncItem): Observable<Blob> {
    if (this.connector.download) {
      return from(this.connector.download(resource)).pipe(
        map((blob) => {
          if (!(blob instanceof Blob)) {
            throw new Error('download must return a Blob');
          }
          return blob;
        }),
      );
    } else {
      throw new Error('Not implemented');
    }
  }

  getLink(resource: SyncItem): Observable<{ uri: string; extra_headers: { [key: string]: string } }> {
    if (this.connector.getLink) {
      return from(this.connector.getLink(resource)).pipe(
        map((link) => {
          if (!link.uri) {
            throw new Error('getLink must return an object with uri and extra_headers properties');
          }
          return { ...link, extra_headers: link.extra_headers || {} };
        }),
      );
    } else {
      throw new Error('Not implemented');
    }
  }
}
