import { ConnectorParameters, Field, FileStatus, ISourceConnectorOld, SearchResults, SyncItem } from '../models';
import { from, map, Observable, of, switchMap } from 'rxjs';

// export const BrightcoveConnector: SourceConnectorDefinition = {
//   id: 'brightcove',
//   title: 'Brightcove',
//   logo: `${baseLogoPath}/brightcove.svg`,
//   description: 'Video delivery platform',
//   factory: () => of(new BrightcoveImpl()),
// };

class BrightcoveImpl implements ISourceConnectorOld {
  hasServerSideAuth = false;
  isExternal = true;
  resumable = false;
  account = '';
  client_id = '';
  client_secret = '';

  getParameters(): Observable<Field[]> {
    return of([
      {
        id: 'account',
        label: 'Account ID',
        type: 'text',
        required: true,
      },
      {
        id: 'client_id',
        label: 'Client ID',
        type: 'text',
        required: true,
      },
      {
        id: 'client_secret',
        label: 'Client secret',
        type: 'text',
        required: true,
      },
    ]);
  }

  handleParameters(params: ConnectorParameters) {
    this.account = params.account;
    this.client_id = params.client_id;
    this.client_secret = params.client_secret;
  }

  goToOAuth() {
    // eslint-disable-next-line no-empty-function
  }

  authenticate(): Observable<boolean> {
    return this.account && this.client_id && this.client_secret ? of(true) : of(false);
  }

  getFiles(query?: string, pageSize?: number): Observable<SearchResults> {
    return this._getFiles(query, pageSize);
  }

  private _getFiles(query?: string, pageSize: number = 50, nextPage = 0): Observable<SearchResults> {
    query = query ? `&query=${query}` : '';
    return this.getToken().pipe(
      switchMap((token) =>
        from(
          fetch(
            `https://cms.api.brightcove.com/v1/accounts/${this.account}/videos?limit=${pageSize}&offset=${nextPage}${query}`,
            {
              method: 'GET',
              headers: { Authorization: `Bearer ${token}` },
            },
          ).then(
            (res) => {
              if (res.status === 401 || res.status === 403) {
                throw new Error('Unauthorized');
              } else {
                return res.json();
              }
            },
            () => {
              throw new Error();
            },
          ),
        ),
      ),
      map((results: any[]) => ({
        items: (results || []).map(this.mapResult),
        nextPage:
          results.length === 0 || results[0].error_code
            ? undefined
            : this._getFiles(query, pageSize, nextPage + pageSize),
      })),
    );
  }

  private mapResult(result: any) {
    return {
      originalId: result.id || '',
      title: result.name || '',
      uuid: result.id,
      metadata: {},
      status: FileStatus.PENDING,
    };
  }

  private getToken(): Observable<string> {
    const credentials = `${this.client_id}:${this.client_secret}`;
    return from(
      fetch('https://oauth.brightcove.com/v4/access_token?grant_type=client_credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${btoa(credentials)}` },
      })
        .then((response) => response.json())
        .then((data) => data.access_token as string),
    );
  }

  getLink(resource: SyncItem): Observable<{ uri: string; extra_headers: { [key: string]: string } }> {
    return this.getToken().pipe(
      switchMap((token) =>
        from(
          fetch(`https://cms.api.brightcove.com/v1/accounts/${this.account}/videos/${resource.originalId}/sources`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          }).then((res) => res.json()),
        ),
      ),
      map((results: any[]) => {
        const playlist = results.find((result: any) => result.src.includes('.m3u8'));
        return playlist ? { uri: playlist.src, extra_headers: {} } : { uri: '', extra_headers: {} };
      }),
    );
  }

  download(resource: SyncItem): Observable<Blob> {
    throw 'Error';
  }
}
