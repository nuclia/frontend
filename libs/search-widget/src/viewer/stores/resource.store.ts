import { BehaviorSubject } from 'rxjs';
import type { Resource } from '@nuclia/core';
import type { EntityGroup } from '../../core/models';
import { generatedEntitiesColor } from '../../core/utils';

export type ResourceStore = {
  resource: BehaviorSubject<Resource | null>;
  resourceEntities: BehaviorSubject<EntityGroup[]>;
  hasEntities: BehaviorSubject<boolean>;
  setResource: (resource: Resource) => void;
};

export const resourceStore = {
  resource: new BehaviorSubject<Resource | null>(null),
  resourceEntities: new BehaviorSubject<EntityGroup[]>([]),
  hasEntities: new BehaviorSubject(false),
  setResource: setResource,
  init: initResourceStore,
};

function initResourceStore() {
  resourceStore.resource.next(null);
  resourceStore.resourceEntities.next([]);
  resourceStore.hasEntities.next(false);
}

function setResource(resource: Resource) {
  resourceStore.resource.next(resource);
  const entityGroups: EntityGroup[] = Object.entries(resource.getNamedEntities())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .reduce((groups, [groupId, entities]) => {
      groups.push({
        id: groupId,
        title: `entities.${groupId.toLowerCase()}`,
        color: generatedEntitiesColor[groupId],
        entities: entities.filter((value) => !!value).sort((a, b) => a.localeCompare(b)),
      });
      return groups;
    }, [] as EntityGroup[]);
  resourceStore.resourceEntities.next(entityGroups);
  resourceStore.hasEntities.next(entityGroups.length > 0);
}
