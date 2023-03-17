import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { filter, map, mapTo, take } from 'rxjs/operators';
import { EntitiesGroup } from '@nuclia/core';
import { EntitiesService } from './entities.service';
import { Entity, MutableEntitiesGroup } from './model';

@Injectable()
export class EntitiesEditService {
  private groups = new BehaviorSubject<{ [key: string]: MutableEntitiesGroup }>({});
  private addedEntity = new Subject<{ entity: Entity; group: string }>();

  constructor(private entitiesService: EntitiesService) {}

  getGroup(groupKey: string): Observable<MutableEntitiesGroup | null> {
    return this.groups.pipe(map((groups) => groups[groupKey] || null));
  }

  getGroups(): Observable<{ [key: string]: MutableEntitiesGroup }> {
    return this.groups.asObservable();
  }

  isEditMode(groupKey: string): Observable<boolean> {
    return this.getGroup(groupKey).pipe(map((value) => !!value));
  }

  getEditMode(): Observable<{ [key: string]: boolean }> {
    return this.groups.pipe(
      map((groups) => {
        const result: { [key: string]: boolean } = {};
        Object.entries(groups).forEach(([key, value]) => {
          result[key] = !!value;
        });
        return result;
      }),
    );
  }

  addEntity(groupKey: string, entityName: string) {
    const isEditMode = !!this.groups.getValue()[groupKey];
    let editableGroup$: Observable<MutableEntitiesGroup>;
    if (isEditMode) {
      editableGroup$ = of(this.groups.getValue()[groupKey]);
    } else {
      editableGroup$ = this.entitiesService.getGroup(groupKey).pipe(
        filter((group): group is EntitiesGroup => !!group),
        map((group) => new MutableEntitiesGroup(group, groupKey)),
      );
    }
    editableGroup$.pipe(take(1)).subscribe((editableGroup) => {
      const entity = editableGroup.addEntity(entityName);
      if (isEditMode) {
        this.setGroup(groupKey, editableGroup);
        this.addedEntity.next({ entity, group: groupKey });
      } else {
        this.entitiesService.setGroup(groupKey, editableGroup).subscribe(() => {
          this.addedEntity.next({ entity, group: groupKey });
        });
      }
    });
  }

  getAddedEntity(group: string): Observable<Entity> {
    return this.addedEntity.pipe(
      filter((added) => added.group === group),
      map((added) => added.entity),
    );
  }

  initGroup(groupKey: string, group: EntitiesGroup) {
    const groups = this.groups.getValue();
    groups[groupKey] = new MutableEntitiesGroup(group, groupKey);
    this.groups.next(groups);
  }

  setGroup(groupKey: string, group: MutableEntitiesGroup) {
    const groups = this.groups.getValue();
    groups[groupKey] = group;
    this.groups.next(groups);
  }

  saveGroup(groupKey: string): Observable<null> {
    const groups = this.groups.getValue();
    if (groups[groupKey]) {
      return this.entitiesService.setGroup(groupKey, groups[groupKey]).pipe(mapTo(null));
    } else {
      return of(null);
    }
  }

  clearGroup(groupKey: string) {
    const groups = this.groups.getValue();
    if (groups[groupKey]) {
      delete groups[groupKey];
      this.groups.next(groups);
    }
  }
}
