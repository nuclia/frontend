import { writableSubject } from '../state-lib';
import type { EntityGroup } from '../models';
import { resource } from './resource.store';
import type { Observable } from 'rxjs';
import { combineLatest, map, take } from 'rxjs';
import { generatedEntitiesColor } from '../utils';
import { _ } from '../i18n';

export const entityGroups = writableSubject<EntityGroup[]>([]);
export const selectedFamily = writableSubject('');

export const selectedFamilyData: Observable<EntityGroup | undefined> = combineLatest([
  entityGroups,
  selectedFamily,
]).pipe(map(([groups, family]) => groups.find((group) => group.id === family)));

export const resourceEntities: Observable<EntityGroup[]> = combineLatest([
  resource,
  entityGroups,
  _.pipe(take(1)),
]).pipe(
  map(([resource, groups, translate]) =>
    !resource ? [] : mapEntities(resource.getNamedEntities(), groups, translate),
  ),
);

export const resourceAnnotatedEntities: Observable<EntityGroup[]> = combineLatest([
  resource,
  entityGroups,
  _.pipe(take(1)),
]).pipe(
  map(([resource, groups, translate]) =>
    !resource ? [] : mapEntities(resource.getAnnotatedEntities(), groups, translate),
  ),
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
  allGroups: EntityGroup[],
  translate: (key: string) => string = (key: string) => key,
): EntityGroup[] {
  return Object.entries(entities)
    .map(([groupId, entities]) => {
      const group = allGroups.find((group) => group.id === groupId);
      const generatedColor = generatedEntitiesColor[groupId];
      const title = group?.title || (generatedColor ? `entities.${groupId.toLowerCase()}` : groupId);
      return {
        id: groupId,
        title,
        color: group?.color || generatedColor,
        entities: entities.filter((value) => !!value).sort((a, b) => a.localeCompare(b)),
      };
    })
    .sort((a, b) => translate(a.title).localeCompare(translate(b.title)));
}
