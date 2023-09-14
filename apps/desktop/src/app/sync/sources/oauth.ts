import { ISourceConnector, ConnectorParameters, Field } from '../models';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { getDeeplink } from '../../utils';
import { environment } from '../../../environments/environment';

const TOKEN = '-token';
const REFRESH = '-refresh';

export class OauthConnector implements ISourceConnector {
  name: string;
  hasServerSideAuth = true;
  isExternal = true;
  resumable = false;
  private isAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(name: string) {
    this.name = name;
  }

  getParameters(): Observable<Field[]> {
    return of([]);
  }

  handleParameters(params: ConnectorParameters) {
    return;
  }

  getParametersValues(): ConnectorParameters {
    return {
      token: localStorage.getItem(this.name + TOKEN),
      refresh: localStorage.getItem(this.name + REFRESH),
      refresh_endpoint: `${environment.dashboard}/api/external_auth/${this.name}/refresh`,
    };
  }

  goToOAuth(reset?: boolean) {
    if (reset) {
      localStorage.removeItem(this.name + TOKEN);
    }
    const token = localStorage.getItem(this.name + TOKEN);
    if (!token) {
      const authorizeEndpoint = `${environment.dashboard}/api/external_auth/${this.name}/authorize`;

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
          clearInterval(interval);
          if (token) {
            localStorage.setItem(this.name + TOKEN, token);
            localStorage.setItem(this.name + REFRESH, refresh || '');
            this.isAuthenticated.next(true);
          } else {
            this.isAuthenticated.next(false);
          }
        }
      }, 500);
    }
    return this.isAuthenticated.asObservable();
  }
}
