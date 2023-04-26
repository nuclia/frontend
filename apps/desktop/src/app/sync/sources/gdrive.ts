import { FileStatus, ISourceConnectorOld, SourceConnectorDefinition, SyncItem, SearchResults } from '../models';
import { catchError, from, map, Observable, of, switchMap } from 'rxjs';
import { GoogleBaseImpl } from './google.base';

// eslint-disable-next-line
declare var gapi: any;

// export const GDrive: SourceConnectorDefinition = {
//   id: 'gdrive',
//   title: 'Google Drive',
//   logo: 'assets/logos/gdrive.svg',
//   description: 'File storage and synchronization service developed by Google',
//   helpUrl: 'https://docs.nuclia.dev/docs/batch/nda/#google-drive-and-google-cloud-connectors-usage',
//   factory: () => of(new GDriveImpl()),
// };

class GDriveImpl extends GoogleBaseImpl implements ISourceConnectorOld {
  isExternal = false;
  resumable = true;
  override DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

  getFiles(query?: string, pageSize?: number) {
    return this.getDrive().pipe(switchMap((drive) => this._getFiles(drive, query, pageSize)));
  }

  private _getFiles(
    drive: any,
    query?: string,
    pageSize: number = 50,
    nextPageToken?: string,
  ): Observable<SearchResults> {
    return from(
      drive.files.list({
        pageSize,
        pageToken: nextPageToken,
        q: query
          ? `name contains '${query}' and not mimeType = 'application/vnd.google-apps.folder'`
          : `not mimeType = 'application/vnd.google-apps.folder'`,
      }),
    ).pipe(
      /* eslint-disable  @typescript-eslint/no-explicit-any */
      map((res: any) => {
        if (res.result) {
          return {
            items: res.result.files.map(this.map),
            nextPage: res.result.nextPageToken
              ? this._getFiles(drive, query, pageSize, res.result.nextPageToken)
              : undefined,
          };
        } else {
          if (res.error?.code?.startsWith('4')) {
            throw new Error('Unauthorized');
          } else {
            throw new Error(res.error.message || 'Unknown error');
          }
        }
      }),
    );
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  map(raw: any): SyncItem {
    return {
      title: raw.name || '',
      originalId: raw.id || '',
      metadata: { mimeType: raw['mimeType'] },
      status: FileStatus.PENDING,
      uuid: raw.uuid || '',
    };
  }

  download(resource: SyncItem): Observable<Blob> {
    return new Observable<Blob>((observer) => {
      const request = resource.metadata['mimeType'].startsWith('application/vnd.google-apps')
        ? `https://www.googleapis.com/drive/v3/files/${resource.originalId}/export?mimeType=application/pdf&supportsAllDrives=true`
        : `https://www.googleapis.com/drive/v3/files/${resource.originalId}?alt=media&supportsAllDrives=true`;

      this.getClient().subscribe((client) =>
        fetch(request, {
          method: 'GET',
          headers: { Authorization: `Bearer ${client.getToken().access_token}` },
        })
          .then((response) => response.blob())
          .then((blob) => {
            observer.next(blob);
            observer.complete();
          }),
      );
    });
  }

  private getDrive(): Observable<any> {
    return this.getClient().pipe(
      map((client) => client.drive),
      catchError(() => {
        throw new Error('Unauthorized');
      }),
    );
  }
}
