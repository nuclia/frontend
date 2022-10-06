import { writableSubject } from './svelte-writable-subject';
import type { EntityGroup } from '../models';

export const entityGroups = writableSubject<EntityGroup[]>([]);

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
