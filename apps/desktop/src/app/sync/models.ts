import { Observable } from 'rxjs';

export interface IConnector {
  data: { [key: string]: string };
  authenticate(): Observable<boolean>;
  getFiles(): Observable<Resource[]>;
  disconnect(): void;
}

export interface Resource {
  title: string;
  originalId: string;
}
