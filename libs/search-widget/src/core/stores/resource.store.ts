import { BehaviorSubject, take } from 'rxjs';
import type { Resource } from '@nuclia/core';
import type { EntityGroup } from '../models';
import { generatedEntitiesColor } from '../utils';
import { _ } from '../../core/i18n';

export type ResourceStore = {
  resource: BehaviorSubject<Resource | null>;
  resourceEntities: BehaviorSubject<EntityGroup[]>;
  resourceAnnotatedEntities: BehaviorSubject<EntityGroup[]>;
  hasEntities: BehaviorSubject<boolean>;
  setResource: (resource: Resource) => void;
};

export const resourceStore = {
  resource: new BehaviorSubject<Resource | null>(null),
  resourceEntities: new BehaviorSubject<EntityGroup[]>([]),
  resourceAnnotatedEntities: new BehaviorSubject<EntityGroup[]>([]),
  hasEntities: new BehaviorSubject(false),
  setResource,
  init: initResourceStore,
};

function initResourceStore() {
  resourceStore.resource.next(null);
  resourceStore.resourceEntities.next([]);
  resourceStore.resourceAnnotatedEntities.next([]);
  resourceStore.hasEntities.next(false);
}

function setResource(resource: Resource) {
  resourceStore.resource.next(resource);
  _.pipe(take(1)).subscribe((translate) => {
    const entityGroups: EntityGroup[] = mapEntities(resource.getNamedEntities(), translate);
    resourceStore.resourceEntities.next(entityGroups);
    resourceStore.hasEntities.next(entityGroups.length > 0);
  });
  refreshAnnotatedEntities(resource);
}

export function refreshAnnotatedEntities(resource: Resource) {
  const annotatedEntityGroups: EntityGroup[] = mapEntities(resource.getAnnotatedEntities());
  resourceStore.resourceAnnotatedEntities.next(annotatedEntityGroups);
}

function mapEntities(
  entities: { [key: string]: string[] },
  translate: (key: string) => string = (key: string) => key,
): EntityGroup[] {
  return Object.entries(entities)
    .map(([groupId, entities]) => ({
      id: groupId,
      title: `entities.${groupId.toLowerCase()}`,
      color: generatedEntitiesColor[groupId],
      entities: entities.filter((value) => !!value).sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => translate(a.title).localeCompare(translate(b.title)));
}
