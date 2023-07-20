import { Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable } from 'rxjs';
import { catchError, filter, map, switchMap, take, tap } from 'rxjs/operators';
import { SDKService, STFUtils } from '@flaps/core';
import { Entities, EntitiesGroup, Entity, IKnowledgeBox, UpdateEntitiesGroupPayload } from '@nuclia/core';

@Injectable({
  providedIn: 'root',
})
export class EntitiesService {
  private entitiesSubject = new BehaviorSubject<Entities | null>(null);

  entities = this.entitiesSubject.asObservable();
  isAdminOrContrib = this.sdk.currentKb.pipe(map((kb) => !!kb.admin || !!kb.contrib));

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

  createFamily(family: { color: string; entities: string; title: string }): Observable<Entities> {
    const groupId = STFUtils.generateSlug(family.title);
    const group: EntitiesGroup = {
      title: family.title,
      color: family.color || '',
      entities: this.formatEntitiesToAdd((family.entities || '').split(',')),
      custom: true,
    };

    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.createEntitiesGroup(groupId, group).pipe(switchMap(() => this._refreshEntities(kb)))),
    );
  }

  updateFamily(
    groupId: string,
    family: {
      color: string;
      entities: string;
      title: string;
    },
    entitiesBackup: string | undefined,
  ): Observable<Entities> {
    const payload: UpdateEntitiesGroupPayload = {
      title: family.title,
      color: family.color,
      add: {},
      update: {},
      delete: [],
    };
    if (entitiesBackup && family.entities !== entitiesBackup) {
      const oldEntities = entitiesBackup.split(',').map((entity) => entity.trim());
      const currentEntities = family.entities.split(',').map((entity) => entity.trim());
      const newEntities = currentEntities.filter((entity) => !oldEntities.includes(entity));
      const deletedEntities = oldEntities.filter((entity) => !currentEntities.includes(entity));
      payload.add = this.formatEntitiesToAdd(newEntities);
      payload.delete = deletedEntities;
    }
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.updateEntitiesGroup(groupId, payload).pipe(switchMap(() => this._refreshEntities(kb)))),
    );
  }

  deleteFamily(groupId: string): Observable<void> {
    return this.sdk.currentKb.pipe(
      filter((kb) => !!kb),
      take(1),
      switchMap((kb) => kb.deleteEntitiesGroup(groupId)),
      tap(() => {
        const entities = this.entitiesSubject.getValue();
        if (entities !== null) {
          const newEntities = { ...entities };
          delete newEntities[groupId];
          this.entitiesSubject.next(newEntities);
        }
      }),
    );
  }

  addEntitiesToFamily(groupId: string, entities: string[]): Observable<Entities> {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        kb
          .updateEntitiesGroup(groupId, { add: this.formatEntitiesToAdd(entities), update: {}, delete: [] })
          .pipe(switchMap(() => this._refreshEntities(kb))),
      ),
    );
  }

  addDuplicate(groupId: string, duplicatedEntity: Entity, mainEntity: Entity): Observable<Entities> {
    if (!mainEntity.represents) {
      mainEntity.represents = [duplicatedEntity.value];
    } else if (!mainEntity.represents.includes(duplicatedEntity.value)) {
      mainEntity.represents.push(duplicatedEntity.value);
    }

    // if duplicated entity has duplicates, add them too
    duplicatedEntity.represents?.forEach((duplicate) => mainEntity.represents?.push(duplicate));

    // Mark duplicated entity as merged
    duplicatedEntity.merged = true;
    duplicatedEntity.represents = [];

    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        kb
          .updateEntitiesGroup(groupId, {
            add: {},
            update: {
              [mainEntity.value]: mainEntity,
              [duplicatedEntity.value]: duplicatedEntity,
            },
            delete: [],
          })
          .pipe(switchMap(() => this._refreshEntities(kb))),
      ),
    );
  }

  removeDuplicate(groupId: string, mainEntity: Entity, duplicate: string): Observable<Entities> {
    mainEntity.represents = mainEntity.represents?.filter((d) => d !== duplicate);

    const entities = this.entitiesSubject.getValue();
    if (!entities) {
      throw new Error('Bad state exception: removeDuplicate called while there is no entities');
    }
    const noMoreDuplicate = entities[groupId].entities[duplicate];
    noMoreDuplicate.merged = false;

    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        kb
          .updateEntitiesGroup(groupId, {
            add: {},
            update: {
              [mainEntity.value]: mainEntity,
              [noMoreDuplicate.value]: noMoreDuplicate,
            },
            delete: [],
          })
          .pipe(switchMap(() => this._refreshEntities(kb))),
      ),
    );
  }

  deleteEntity(groupId: string, entityId: string): Observable<Entities> {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        kb
          .updateEntitiesGroup(groupId, { add: {}, update: {}, delete: [entityId] })
          .pipe(switchMap(() => this._refreshEntities(kb))),
      ),
    );
  }

  private _refreshEntities(kb: IKnowledgeBox): Observable<Entities> {
    return kb.getEntities(true).pipe(
      catchError(() => {
        this.entitiesSubject.next(null);
        return EMPTY;
      }),
      tap((entities) => {
        this.entitiesSubject.next(entities);
      }),
    );
  }

  private formatEntitiesToAdd(entities: string[]): { [key: string]: Entity } {
    return entities.reduce((map, family) => {
      const familyId = family.trim();
      map[familyId] = { value: familyId };
      return map;
    }, {} as { [key: string]: Entity });
  }
}
