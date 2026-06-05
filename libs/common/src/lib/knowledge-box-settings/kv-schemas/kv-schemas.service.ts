import { inject, Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { KBKVSchemas, KVSchema, UpdateKVSchema } from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { EMPTY, merge, Observable, of, Subject } from 'rxjs';
import { catchError, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class KvSchemasService {
  private sdk = inject(SDKService);
  private toaster = inject(SisToastService);

  private _currentKb = this.sdk.currentKb;
  private _initialData = this._currentKb.pipe(
    switchMap((kb) =>
      kb.getKVSchemas().pipe(
        catchError(() => {
          this.toaster.error('kb.kv-schemas.error.load');
          return of({ schemas: {} });
        }),
      ),
    ),
  );
  private _updatedData = new Subject<KBKVSchemas>();
  private _schemasData = merge(this._initialData, this._updatedData).pipe(shareReplay(1));

  schemas$ = this._schemasData.pipe(map((data) => Object.values(data.schemas)));

  createSchema(schema: KVSchema): Observable<void> {
    return this._currentKb.pipe(
      take(1),
      switchMap((kb) => kb.createKVSchema(schema)),
      switchMap(() => this.refreshSchemas()),
      tap(() => this.toaster.success('kb.kv-schemas.success.create')),
      map(() => undefined),
      catchError(() => {
        this.toaster.error('kb.kv-schemas.error.create');
        return EMPTY;
      }),
    );
  }

  updateSchema(id: string, update: UpdateKVSchema): Observable<void> {
    return this._currentKb.pipe(
      take(1),
      switchMap((kb) => kb.updateKVSchema(id, update)),
      switchMap(() => this.refreshSchemas()),
      tap(() => this.toaster.success('kb.kv-schemas.success.update')),
      map(() => undefined),
      catchError(() => {
        this.toaster.error('kb.kv-schemas.error.update');
        return EMPTY;
      }),
    );
  }

  deleteSchema(id: string): Observable<void> {
    return this._currentKb.pipe(
      take(1),
      switchMap((kb) => kb.deleteKVSchema(id)),
      switchMap(() => this.refreshSchemas()),
      tap(() => this.toaster.success('kb.kv-schemas.success.delete')),
      map(() => undefined),
      catchError(() => {
        this.toaster.error('kb.kv-schemas.error.delete');
        return EMPTY;
      }),
    );
  }

  private refreshSchemas(): Observable<KBKVSchemas> {
    return this._currentKb.pipe(
      take(1),
      switchMap((kb) => kb.getKVSchemas()),
      tap((data) => this._updatedData.next(data)),
    );
  }
}
