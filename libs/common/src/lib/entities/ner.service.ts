import { Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, map, Observable } from 'rxjs';
import { catchError, filter, switchMap, take, tap } from 'rxjs/operators';
import { FeaturesService, SDKService, STFUtils } from '@flaps/core';
import { EntitiesGroup, Entity, IKnowledgeBox, UpdateEntitiesGroupPayload } from '@nuclia/core';
import { getNerFamilyTitle, NerFamily } from '@flaps/common';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class NerService {
  private entitiesSubject = new BehaviorSubject<{ [key: string]: NerFamily } | null>(null);

  entities = this.entitiesSubject.asObservable();
  nerFamilies: Observable<NerFamily[]> = this.entities.pipe(
    filter((entities): entities is { [key: string]: NerFamily } => !!entities),
    map((entities) => this.getNerFamilyWithTitles(entities)),
  );
  isAdminOrContrib = this.features.isKbAdminOrContrib;

  constructor(
    private sdk: SDKService,
    private translate: TranslateService,
    private features: FeaturesService,
  ) {
    this.sdk.currentKb
      .pipe(
        tap(() => {
          this.entitiesSubject.next(null);
        }),
        filter((kb) => !!kb),
        switchMap((kb) => kb.getEntities()),
      )
      .subscribe({
        next: (entities) => {
          this.entitiesSubject.next(
            Object.entries(entities)
              .map(([familyKey, family]) => ({
                ...family,
                key: familyKey,
                entities: undefined, // TODO: this line can be removed once getEntities method does not return "entities" property
              }))
              .reduce((acc, family) => ({ ...acc, [family.key]: family }), {}),
          );
        },
        error: () => this.entitiesSubject.next(null),
      });
  }

  getNerFamilyWithTitles(entities: { [key: string]: NerFamily }): NerFamily[] {
    return Object.entries(entities)
      .map(([familyKey, family]) => ({
        ...family,
        title: getNerFamilyTitle(familyKey, family, this.translate),
      }))
      .sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }

  createFamily(family: { color: string; entities: string; title: string }): Observable<EntitiesGroup> {
    const groupId = STFUtils.generateSlug(family.title);
    const group: EntitiesGroup = {
      title: family.title,
      color: family.color || '',
      entities: this.formatEntitiesToAdd((family.entities || '').split(',')),
      custom: true,
    };

    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.createEntitiesGroup(groupId, group).pipe(switchMap(() => this._refreshFamily(kb, groupId)))),
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
  ): Observable<EntitiesGroup> {
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
      switchMap((kb) =>
        kb.updateEntitiesGroup(groupId, payload).pipe(switchMap(() => this._refreshFamily(kb, groupId))),
      ),
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

  addEntitiesToFamily(groupId: string, entities: string[]): Observable<EntitiesGroup> {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        kb
          .updateEntitiesGroup(groupId, { add: this.formatEntitiesToAdd(entities), update: {}, delete: [] })
          .pipe(switchMap(() => this._refreshFamily(kb, groupId))),
      ),
    );
  }

  addDuplicate(groupId: string, duplicatedEntities: Entity[], mainEntity: Entity): Observable<EntitiesGroup> {
    const allValues = duplicatedEntities.map((entity) => entity.value);
    if (mainEntity.represents) {
      allValues.push(...mainEntity.represents);
    }
    // if duplicated entity has duplicates, add them too
    duplicatedEntities.forEach((entity) => {
      if (entity.represents) {
        allValues.push(...entity.represents);
      }
    });
    // make all values unique
    mainEntity.represents = [...new Set(allValues)];

    // Mark duplicated entity as merged
    duplicatedEntities = duplicatedEntities.map((entity) => ({ ...entity, merged: true, represents: [] }));

    const update = { [mainEntity.value]: mainEntity };
    duplicatedEntities.forEach((entity) => {
      update[entity.value] = entity;
    });
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        kb
          .updateEntitiesGroup(groupId, {
            add: {},
            update,
            delete: [],
          })
          .pipe(switchMap(() => this._refreshFamily(kb, groupId))),
      ),
    );
  }

  removeDuplicate(groupId: string, mainEntity: Entity, duplicate: string): Observable<EntitiesGroup> {
    mainEntity.represents = mainEntity.represents?.filter((d) => d !== duplicate);

    const entities = this.entitiesSubject.getValue();
    const noMoreDuplicate = entities?.[groupId].entities?.[duplicate];
    if (!noMoreDuplicate) {
      throw new Error('Bad state exception: removeDuplicate called while there is no entities');
    }
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
          .pipe(switchMap(() => this._refreshFamily(kb, groupId))),
      ),
    );
  }

  deleteEntities(groupId: string, entities: Entity[]): Observable<EntitiesGroup> {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        kb
          .updateEntitiesGroup(groupId, { add: {}, update: {}, delete: entities.map((entity) => entity.value) })
          .pipe(switchMap(() => this._refreshFamily(kb, groupId))),
      ),
    );
  }

  refreshFamily(familyId: string): Observable<EntitiesGroup> {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => this._refreshFamily(kb, familyId)),
    );
  }

  private _refreshFamily(kb: IKnowledgeBox, familyId: string): Observable<EntitiesGroup> {
    return kb.getEntitiesGroup(familyId).pipe(
      catchError(() => {
        return EMPTY;
      }),
      tap((family) => {
        this.entitiesSubject.next({
          ...this.entitiesSubject.getValue(),
          [familyId]: { ...family, key: familyId, title: family.title || '' },
        });
      }),
    );
  }

  private formatEntitiesToAdd(entities: string[]): { [key: string]: Entity } {
    return entities.reduce(
      (map, family) => {
        const familyId = family.trim();
        map[familyId] = { value: familyId };
        return map;
      },
      {} as { [key: string]: Entity },
    );
  }
}
