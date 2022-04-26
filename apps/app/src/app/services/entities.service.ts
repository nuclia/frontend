import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, filter, take, switchMap, tap } from 'rxjs/operators';
import { SDKService } from '@flaps/auth';
import { Entities, EntitiesGroup, IKnowledgeBox } from '@nuclia/core';
import { MutableEntitiesGroup } from '../entities/model';

@Injectable({
  providedIn: 'root',
})
export class EntitiesService {
  private entitiesSubject = new BehaviorSubject<Entities | null>(null);

  constructor(private sdk: SDKService) {
    this.sdk.currentKb
      .pipe(
        tap(() => {
          this.entitiesSubject.next(null);
        }),
        filter((kb) => !!kb),
        switchMap((kb) => this._refreshEntities(kb)),
      )
      .subscribe();
  }

  getEntities(): Observable<Entities | null> {
    return this.entitiesSubject;
  }

  getGroup(groupKey: string): Observable<EntitiesGroup | null> {
    return this.entitiesSubject.pipe(map((data) => data?.[groupKey] || null));
  }

  setGroup(groupKey: string, group: MutableEntitiesGroup): Observable<EntitiesGroup> {
    return this.sdk.currentKb.pipe(
      filter((kb) => !!kb),
      take(1),
      switchMap((kb) =>
        kb.setEntitiesGroup(groupKey, group.getCopy()).pipe(switchMap(() => this._refreshEntitiesGroup(kb, groupKey))),
      ),
    );
  }

  deleteGroup(groupKey: string): Observable<void> {
    return this.sdk.currentKb.pipe(
      filter((kb) => !!kb),
      take(1),
      switchMap((kb) => kb.deleteEntitiesGroup(groupKey)),
      tap(() => {
        const entities = this.entitiesSubject.getValue();
        if (entities !== null) {
          const newEntities = { ...entities };
          delete newEntities[groupKey];
          this.entitiesSubject.next(newEntities);
        }
      }),
    );
  }

  private _refreshEntities(kb: IKnowledgeBox): Observable<Entities> {
    return kb.getEntities().pipe(
      tap((entities) => {
        this.entitiesSubject.next(entities);
      }),
    );
  }

  private _refreshEntitiesGroup(kb: IKnowledgeBox, groupKey: string): Observable<EntitiesGroup> {
    return kb.getEntitiesGroup(groupKey).pipe(
      tap((entitiesGroup) => {
        const entities = this.entitiesSubject.getValue();
        if (entities !== null) {
          const newEntities = { ...entities };
          newEntities[groupKey] = entitiesGroup;
          this.entitiesSubject.next(newEntities);
        } else {
          this.entitiesSubject.next({ groupKey: entitiesGroup });
        }
      }),
    );
  }
}
