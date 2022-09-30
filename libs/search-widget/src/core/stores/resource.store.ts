import { BehaviorSubject, take } from 'rxjs';
import type { Resource } from '@nuclia/core';
import type { EntityGroup } from '../models';
import { generatedEntitiesColor } from '../utils';
import { _ } from '../../core/i18n';

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
  setResource,
  init: initResourceStore,
};

function initResourceStore() {
  resourceStore.resource.next(null);
  resourceStore.resourceEntities.next([]);
  resourceStore.hasEntities.next(false);
}

function setResource(resource: Resource) {
  resourceStore.resource.next(resource);
  _.pipe(take(1)).subscribe((translate) => {
    const entityGroups: EntityGroup[] = Object.entries(resource.getNamedEntities())
      .map(([groupId, entities]) => ({
        id: groupId,
        title: `entities.${groupId.toLowerCase()}`,
        color: generatedEntitiesColor[groupId],
        entities: entities.filter((value) => !!value).sort((a, b) => a.localeCompare(b)),
      }))
      .sort((a, b) => translate(a.title).localeCompare(translate(b.title)));
    resourceStore.resourceEntities.next(entityGroups);
    resourceStore.hasEntities.next(entityGroups.length > 0);
  });
}
