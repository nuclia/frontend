import {
  ISourceConnector,
  SourceConnectorDefinition,
  SyncItem,
  Field,
  ConnectorParameters,
  FileStatus,
  SearchResults,
} from '../models';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';

type ElectronFile = File & { path: string };
const FILES_TO_IGNORE = ['.DS_Store', 'Thumbs.db'];

export const FolderConnector: SourceConnectorDefinition = {
  id: 'folder',
  title: 'Folder',
  logo: 'assets/logos/folder.svg',
  description: 'Upload a folder from your device',
  factory: () => of(new FolderImpl()),
};

class FolderImpl implements ISourceConnector {
  hasServerSideAuth = false;
  isExternal = false;
  resumable = false;
  files: ElectronFile[] = [];
  private isAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  getParameters(): Observable<Field[]> {
    return of([
      {
        id: 'folder',
        label: '',
        type: 'folder',
        required: true,
      },
    ]);
  }

  goToOAuth() {
    // eslint-disable-next-line no-empty-function
  }

  handleParameters(params: ConnectorParameters) {
    if (params['folder']) {
      this.files = params['folder'].filter((file: ElectronFile) => !FILES_TO_IGNORE.includes(file.name));
    }
  }

  authenticate(): Observable<boolean> {
    this.isAuthenticated.next(true);
    return this.isAuthenticated.asObservable();
  }

  private map(files: ElectronFile[]): SyncItem[] {
    return files.map((file) => ({
      title: file.name,
      originalId: file.path,
      metadata: { mimeType: file.type },
      status: FileStatus.PENDING,
      uuid: '',
    }));
  }

  getFiles(query?: string, pageSize?: number) {
    return this._getFiles(query, pageSize);
  }

  private _getFiles(query?: string, pageSize: number = 50, offset: number = 0): Observable<SearchResults> {
    const files = query ? this.searchFiles(query) : this.files;
    const hasMoreResults = files.length > offset + pageSize;
    return of({
      items: this.map(files.slice(offset, offset + pageSize)),
      nextPage: hasMoreResults ? this._getFiles(query, pageSize, offset + pageSize) : undefined,
    });
  }

  private searchFiles(query: string) {
    const regex = new RegExp(`(${query})`, 'i');
    return this.files.filter((file) => regex.test(file.name));
  }

  download(resource: SyncItem): Observable<Blob> {
    const file = this.files.find((file) => file.path === resource.originalId);
    if (file) {
      return of(file);
    }
    return throwError(() => 'Error');
  }
}
