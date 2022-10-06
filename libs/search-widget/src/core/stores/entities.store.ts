import { writableSubject } from './svelte-writable-subject';
import type { EntityGroup } from '../models';
import { resource } from './resource.store';
import type { Observable } from 'rxjs';
import { combineLatest, map, take } from 'rxjs';
import { generatedEntitiesColor, generatedEntitiesId } from '../utils';
import { _ } from '../i18n';

export const entityGroups = writableSubject<EntityGroup[]>([]);

export const resourceEntities: Observable<EntityGroup[]> = combineLatest([resource, _.pipe(take(1))]).pipe(
  map(([resource, translate]) => (!resource ? [] : mapEntities(resource.getNamedEntities(), translate))),
);

export const resourceAnnotatedEntities: Observable<EntityGroup[]> = combineLatest([resource, _.pipe(take(1))]).pipe(
  map(([resource, translate]) => (!resource ? [] : mapEntities(resource.getAnnotatedEntities(), translate))),
);

export function addEntity(entity: string, family: EntityGroup) {
  if (!family.entities.map((entity) => entity.toLocaleLowerCase()).includes(entity.toLocaleLowerCase())) {
    family.entities.push(entity);
    entityGroups.update((groups) => {
      const index = groups.findIndex((group) => group.id === family.id);
      if (index > -1) {
        groups[index] = family;
      }
      return groups;
    });
  }
}

function mapEntities(
  entities: { [key: string]: string[] },
  translate: (key: string) => string = (key: string) => key,
): EntityGroup[] {
  return Object.entries(entities)
    .map(([groupId, entities]) => ({
      id: groupId,
      title: generatedEntitiesId.includes(groupId) ? `entities.${groupId.toLowerCase()}` : groupId,
      color: generatedEntitiesColor[groupId],
      entities: entities.filter((value) => !!value).sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => translate(a.title).localeCompare(translate(b.title)));
}
