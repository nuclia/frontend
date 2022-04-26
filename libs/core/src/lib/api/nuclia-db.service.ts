import { Injectable } from '@angular/core';
import { APIService } from '@flaps/auth';
import { NucliaDB, NucliaDBKeyCreation, NucliaDBMeta } from '../models/nuclia-db.model';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

const VERSION = 'v1';
const ACCOUNT = 'account';
const NUCLIA_DB = 'nucliadb'

@Injectable({
  providedIn: 'root',
})
export class NucliaDBService {
  constructor(private api: APIService) {}

  getKey(accountSlug: string): Observable<NucliaDBMeta | null> {
    return this.api.get(`/${VERSION}/${ACCOUNT}/${accountSlug}/${NUCLIA_DB}/key`, true, undefined, true).pipe(
      catchError(error => {
        if (error.status === 404) {
          return of(null)
        }
        else {
          return throwError(error);
        }
      })
    );
  }
  
  createKey(accountSlug: string, data: NucliaDBKeyCreation): Observable<NucliaDB> {
    return this.api.put(`/${VERSION}/${ACCOUNT}/${accountSlug}/${NUCLIA_DB}/key`, data, true, true);
  }

  deleteKey(accountSlug: string): Observable<NucliaDB> {
    return this.api.delete(`/${VERSION}/${ACCOUNT}/${accountSlug}/${NUCLIA_DB}/key`, true, true);
  }
}