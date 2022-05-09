import { Observable } from 'rxjs';

export interface IDownloadConnector {
  data: { [key: string]: string };
  authenticate(): Observable<boolean>;
  getFiles(query?: string): Observable<Resource[]>;
  disconnect(): void;
  download(resource: Resource): Observable<Blob>;
}

export interface Resource {
  title: string;
  originalId: string;
  type: string;
}

export interface IUploadConnector {
  authenticate(): Observable<boolean>;
  disconnect(): void;
  upload(filename: string, blob: Blob): Observable<void>;
}
