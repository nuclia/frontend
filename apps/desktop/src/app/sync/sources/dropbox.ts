import {
  ConnectorDefinition,
  ConnectorSettings,
  FileStatus,
  ISourceConnector,
  SourceConnectorDefinition,
  SyncItem,
} from '../models';
import { BehaviorSubject, filter, from, map, Observable, of, switchMap, take } from 'rxjs';
import { injectScript } from '../inject';

declare var Dropbox: any;

export const DropboxConnector: SourceConnectorDefinition = {
  id: 'dropbox',
  title: 'Dropbox',
  logo: 'assets/logos/dropbox.svg',
  description: 'File storage and synchronization service developed by Dropbox',
  factory: (data?: ConnectorSettings) => of(new DropboxImpl(data)),
};

const DROPBOX_VERIFIER_CODE_KEY = 'DROPBOX_VERIFIER_CODE';
const DROPBOX_TOKEN_KEY = 'DROPBOX_TOKEN';
const DROPBOX_REFRESH_TOKEN_KEY = 'DROPBOX_REFRESH_TOKEN';
class DropboxImpl implements ISourceConnector {
  hasServerSideAuth = true;
  private isAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  CLIENT_ID: string;
  dbx?: any;
  dbxAuth?: any;

  constructor(data?: ConnectorSettings) {
    this.CLIENT_ID = data?.CLIENT_ID || '';
  }

  goToOAuth() {
    injectScript('https://cdnjs.cloudflare.com/ajax/libs/dropbox.js/10.30.0/Dropbox-sdk.min.js').subscribe(() => {
      const token = localStorage.getItem(DROPBOX_TOKEN_KEY);
      if (!token) {
        this.dbxAuth = new Dropbox.DropboxAuth({
          clientId: this.CLIENT_ID,
        });
        this.dbxAuth
          .getAuthenticationUrl(this.getRedirect(), undefined, 'code', 'offline', undefined, undefined, true)
          .then((authUrl: string) => {
            localStorage.setItem(DROPBOX_VERIFIER_CODE_KEY, this.dbxAuth.codeVerifier);
            if ((window as any)['electron']) {
              (window as any)['electron'].openExternal(authUrl);
            } else {
              location.href = authUrl;
            }
          });
      } else {
        this.dbxAuth = new Dropbox.DropboxAuth({
          clientId: this.CLIENT_ID,
          accessToken: token,
          refreshToken: localStorage.getItem(DROPBOX_REFRESH_TOKEN_KEY),
        });
      }
    });
  }

  authenticate(): Observable<boolean> {
    if (!this.isAuthenticated.getValue()) {
      injectScript('https://cdnjs.cloudflare.com/ajax/libs/dropbox.js/10.30.0/Dropbox-sdk.min.js').subscribe(() => {
        const token = localStorage.getItem(DROPBOX_TOKEN_KEY);
        if (!token) {
          if (!this.dbxAuth) {
            this.dbxAuth = new Dropbox.DropboxAuth({
              clientId: this.CLIENT_ID,
            });
            this.dbxAuth.setCodeVerifier(localStorage.getItem(DROPBOX_VERIFIER_CODE_KEY));
          }
          const interval = setInterval(() => {
            const deeplink = (window as any)['deeplink'] || location.search;
            if (deeplink && deeplink.includes('?')) {
              const code = new URLSearchParams(deeplink.split('?')[1]).get('code');
              clearInterval(interval);
              this.dbxAuth.getAccessTokenFromCode(this.getRedirect(), code).then((response: any) => {
                localStorage.setItem(DROPBOX_TOKEN_KEY, response.result.access_token);
                localStorage.setItem(DROPBOX_REFRESH_TOKEN_KEY, response.result.refresh_token);
                this.dbxAuth.setAccessToken(response.result.access_token);
                this.dbxAuth.setRefreshToken(response.result.refresh_token);
                this.dbx = new Dropbox.Dropbox({
                  auth: this.dbxAuth,
                });
                this.isAuthenticated.next(true);
              });
            }
          }, 500);
        } else {
          if (!this.dbxAuth) {
            this.dbxAuth = new Dropbox.DropboxAuth({
              clientId: this.CLIENT_ID,
              accessToken: token,
              refreshToken: localStorage.getItem(DROPBOX_REFRESH_TOKEN_KEY),
            });
            this.dbxAuth.setCodeVerifier(localStorage.getItem(DROPBOX_VERIFIER_CODE_KEY));
          }
          this.dbx = new Dropbox.Dropbox({
            auth: this.dbxAuth,
          });
          this.isAuthenticated.next(true);
        }
      });
    }
    return this.isAuthenticated.asObservable();
  }

  getFiles(query?: string, start?: number): Observable<SyncItem[]> {
    return this.authenticate().pipe(
      filter((isSigned) => isSigned),
      take(1),
      switchMap(() =>
        !query
          ? from(
              this.dbx.filesListFolder({
                path: '',
              }),
            ).pipe(
              /* eslint-disable  @typescript-eslint/no-explicit-any */
              map((res: any) => res.result.entries?.map(this.mapFiles) || []),
            )
          : from(this.dbx.filesSearch({ path: '', query })).pipe(
              /* eslint-disable  @typescript-eslint/no-explicit-any */
              map((res: any) => res.result?.matches?.map(this.mapResults) || []),
            ),
      ),
    );
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  private mapFiles(raw: any): SyncItem {
    return {
      title: raw?.['name'] || '',
      originalId: raw?.['id'] || '',
      metadata: {},
      status: FileStatus.PENDING,
    };
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  private mapResults(raw: any): SyncItem {
    return {
      title: raw.metadata?.['name'] || '',
      originalId: raw.metadata?.['id'] || '',
      metadata: {},
      status: FileStatus.PENDING,
    };
  }

  download(resource: SyncItem): Observable<Blob> {
    return this.getInstance().pipe(
      switchMap(
        () =>
          new Observable<Blob>((observer) => {
            this.dbx
              .filesDownload({ path: resource.originalId })
              .then((data: any) => data.result.fileBlob)
              .then((blob: Blob) => {
                observer.next(blob);
                observer.complete();
              });
          }),
      ),
    );
  }

  private getInstance(): Observable<void> {
    return new Observable<void>((observer) => {
      injectScript('https://cdnjs.cloudflare.com/ajax/libs/dropbox.js/10.30.0/Dropbox-sdk.min.js').subscribe(() => {
        const dbxAuth = new Dropbox.DropboxAuth({
          clientId: this.CLIENT_ID,
        });
        dbxAuth.setAccessToken(localStorage.getItem(DROPBOX_TOKEN_KEY));
        this.dbx = new Dropbox.Dropbox({
          auth: dbxAuth,
        });
        observer.next();
        observer.complete();
      });
    });
  }

  private getRedirect(): string {
    return (window as any)['electron'] ? 'nuclia-desktop://index.html' : 'http://localhost:4200/';
  }
}
