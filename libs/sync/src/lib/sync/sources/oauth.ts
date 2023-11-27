import { ISourceConnector, ConnectorParameters, Field } from '../models';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { clearDeeplink, getDeeplink } from '../../utils';

const TOKEN = 'token';
const REFRESH = 'refresh';

export class OAuthConnector implements ISourceConnector {
  name: string;
  id: string;
  path: string;
  hasServerSideAuth = true;
  isExternal = true;
  resumable = false;
  private isAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(name: string, id: string, path: string) {
    this.name = name;
    this.id = id;
    this.path = path;
  }

  getParameters(): Observable<Field[]> {
    return of([]);
  }

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

  goToOAuth(reset?: boolean) {
    if (reset) {
      localStorage.removeItem(this.prefixStorageKey(TOKEN));
    }
    const token = localStorage.getItem(this.prefixStorageKey(TOKEN));
    if (!token) {
      const authorizeEndpoint = `${this.path}/api/external_auth/${this.name}/authorize`;

      if ((window as any)['electron']) {
        (window as any)['electron'].openExternal(`${authorizeEndpoint}?redirect=nuclia-desktop://index.html`);
      } else {
        location.href = `${authorizeEndpoint}?redirect=http://localhost:4200`;
      }
    } else {
      this.isAuthenticated.next(true);
    }
  }

  authenticate(): Observable<boolean> {
    if (!this.isAuthenticated.getValue()) {
      const interval = setInterval(() => {
        const deeplink = getDeeplink();
        if (deeplink && deeplink.includes('?')) {
          const params = new URLSearchParams(deeplink.split('?')[1]);
          const token = params.get('token') || '';
          const refresh = params.get('refresh') || '';
          clearDeeplink();
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
}
