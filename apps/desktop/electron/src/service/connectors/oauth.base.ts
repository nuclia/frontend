import { Observable, from, map } from 'rxjs';
import { ConnectorParameters } from '../models';

export class OAuthBaseConnector {
  params: ConnectorParameters = {};
  refreshAuthentication(): Observable<boolean> {
    return from(
      fetch(`${this.params.refresh_endpoint}?refresh_token=${this.params.refresh}`, {
        method: 'GET',
        headers: {
          origin: 'http://localhost:4200/',
        },
      }).then((res) => res.json()),
    ).pipe(
      map((res) => {
        if (res.token) {
          this.params.token = res.token;
          return true;
        } else {
          this.params.token = '';
          this.params.refresh = '';
          return false;
        }
      }),
    );
  }
}
