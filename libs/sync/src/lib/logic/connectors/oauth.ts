import { ConnectorParameters, IConnector, Section, SyncItem } from '../models';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { getURLParams } from '../../utils';

const TOKEN = 'token';
const REFRESH = 'refresh';

export class OAuthConnector implements IConnector {
  name: string;
  id: string;
  path: string;
  hasServerSideAuth = true;
  isExternal = true;
  allowToSelectFolders = false;
  resumable = false;
  canSyncSecurityGroups: boolean;
  private isAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(name: string, id: string, path: string) {
    this.canSyncSecurityGroups = name === 'gdrive';
    this.name = name;
    this.id = id;
    this.path = path;
  }

  getParametersSections(): Observable<Section[]> {
    return of([]);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleParameters(params: ConnectorParameters) {
    return;
  }

  getParametersValues(): ConnectorParameters {
    return {
      token: localStorage.getItem(this.prefixStorageKey(TOKEN)),
      refresh: localStorage.getItem(this.prefixStorageKey(REFRESH)),
      refresh_endpoint: `${this.path}/api/external_auth/${this.name}/refresh`,
    };
  }

  cleanAuthData() {
    localStorage.removeItem(this.prefixStorageKey(TOKEN));
    localStorage.removeItem(this.prefixStorageKey(REFRESH));
  }

  authenticate(): Observable<boolean> {
    if (!this.isAuthenticated.getValue()) {
      const interval = setInterval(() => {
        const deeplink = getURLParams();
        if (deeplink && deeplink.includes('?')) {
          const params = new URLSearchParams(deeplink.split('?')[1]);
          const token = params.get('token') || '';
          const refresh = params.get('refresh') || '';
          clearInterval(interval);
          if (token) {
            localStorage.setItem(this.prefixStorageKey(TOKEN), token);
            localStorage.setItem(this.prefixStorageKey(REFRESH), refresh || '');
            this.isAuthenticated.next(true);
          } else {
            this.isAuthenticated.next(false);
          }
        }
      }, 500);
    }
    return this.isAuthenticated.asObservable();
  }

  private prefixStorageKey(key: string): string {
    return `${this.name}-${this.id}-${key}`;
  }

  getStaticFolders(): SyncItem[] {
    return [];
  }
}
