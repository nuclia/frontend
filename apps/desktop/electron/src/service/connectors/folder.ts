import * as fs from 'fs';
import path from 'path';
import { Blob as FSBlob } from 'buffer';
import {
  FileStatus,
  ISourceConnector,
  SourceConnectorDefinition,
  SyncItem,
  SearchResults,
  ConnectorParameters,
  Link,
} from '../models';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';

const FILES_TO_IGNORE = ['.DS_Store', 'Thumbs.db'];

export const FolderConnector: SourceConnectorDefinition = {
  id: 'folder',
  factory: () => new FolderImpl(),
};

class FolderImpl implements ISourceConnector {
  isExternal = false;
  params: ConnectorParameters = {};

  hasAuthData(): boolean {
    return true;
  }

  setParameters(params: ConnectorParameters) {
    this.params = params;
  }

  getParameters(): ConnectorParameters {
    return this.params;
  }

  getFolders(query?: string): Observable<SearchResults> {
    throw new Error('Method not implemented.');
  }

  getFiles(query?: string): Observable<SearchResults> {
    return this._getFiles(this.params.path, query);
  }

  getLastModified(since: string, folders?: SyncItem[]): Observable<SyncItem[]> {
    try {
      return forkJoin(
        (folders || []).map((folder) =>
          this._getFiles(folder.originalId).pipe(
            switchMap((results) => this.getFilesModifiedSince(results.items, since)),
          ),
        ),
      ).pipe(map((results) => results.reduce((acc, result) => acc.concat(result), [] as SyncItem[])));
    } catch (err) {
      return of([]);
    }
  }

  private _getFiles(path: string, query?: string): Observable<SearchResults> {
    return of({
      items: this.mapFSFiles(this.listAllFiles(path)).filter((item) =>
        query ? item.title.toLocaleLowerCase().includes(query?.toLocaleLowerCase()) : true,
      ),
    });
  }

  private listAllFiles(folderpath: string): string[] {
    let files: string[] = [];
    const contents = fs
      .readdirSync(folderpath)
      .filter((file) => !FILES_TO_IGNORE.includes(file))
      .map((file) => path.join(folderpath, file));
    contents.forEach((contentPath) => {
      if (fs.statSync(contentPath).isDirectory()) {
        files = [...files, ...this.listAllFiles(contentPath)];
      } else {
        files.push(contentPath);
      }
    });
    return files;
  }

  private getFilesModifiedSince(items: SyncItem[], since: string): Promise<SyncItem[]> {
    return Promise.all(
      items.map((item) => {
        return new Promise<SyncItem | undefined>((resolve, reject) => {
          fs.stat(item.originalId, (err, stats) => {
            if (err) {
              reject(err);
            } else {
              if (stats.ctime > new Date(since)) {
                resolve(item);
              } else {
                resolve(undefined);
              }
            }
          });
        });
      }),
    ).then((results) => results.filter((result) => !!result).map((result) => result as SyncItem));
  }

  private mapFSFiles(files: string[]): SyncItem[] {
    return files.map((file) => ({
      title: file.split('/').pop() || '',
      originalId: file,
      metadata: {},
      status: FileStatus.PENDING,
      uid: '',
    }));
  }

  download(resource: SyncItem): Observable<Blob | undefined> {
    try {
      const buffer = fs.readFileSync(resource.originalId);
      const blob = new FSBlob([buffer], { type: 'application/octet-stream' });
      return of(blob as Blob);
    } catch (e) {
      console.error(e);
      return of(undefined);
    }
  }

  getLink(resource: SyncItem): Observable<Link> {
    throw new Error('Method not implemented.');
  }

  refreshAuthentication(): Observable<boolean> {
    return of(true);
  }
}
