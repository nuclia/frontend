import { ISourceConnector, SourceConnectorDefinition, ConnectorParameters, Field } from '../models';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { getDeeplink } from '../../utils';
import { environment } from '../../../environments/environment';

export const GDriveConnector: SourceConnectorDefinition = {
  id: 'gdrive',
  title: 'Google Drive',
  logo: 'assets/logos/gdrive.svg',
  description: 'File storage and synchronization service developed by Google',
  factory: () => of(new GDriveImpl()),
};

const TOKEN = 'gdrive-token';
const REFRESH = 'gdrive-refresh';

class GDriveImpl implements ISourceConnector {
  hasServerSideAuth = true;
  isExternal = true;
  resumable = false;
  private isAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  getParameters(): Observable<Field[]> {
    return of([]);
  }

  handleParameters(params: ConnectorParameters) {
    return;
  }

  getParametersValues(): ConnectorParameters {
    return {
      token: localStorage.getItem(TOKEN),
      refresh: localStorage.getItem(REFRESH),
      refresh_endpoint: `${environment.dashboard}/api/external_auth/gdrive/refresh`,
    };
  }

  goToOAuth(reset?: boolean) {
    if (reset) {
      localStorage.removeItem(TOKEN);
    }
    const token = localStorage.getItem(TOKEN);
    if (!token) {
      const authorizeEndpoint = `${environment.dashboard}/api/external_auth/gdrive/authorize`;

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
            localStorage.setItem(TOKEN, token);
            localStorage.setItem(REFRESH, refresh || '');
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
