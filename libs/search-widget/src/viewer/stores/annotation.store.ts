import { BehaviorSubject } from 'rxjs';

export type CustomEntity = {
  paragraphId: string;
  entityFamilyId: string;
  entity: string;
  start: number;
  end: number;
};

export type AnnotationStore = {
  annotationMode: BehaviorSubject<boolean>;
  selectedFamily: BehaviorSubject<string | null>;
  customEntities: BehaviorSubject<CustomEntity[]>;
};

export const annotationStore: AnnotationStore = {
  annotationMode: new BehaviorSubject(false),
  selectedFamily: new BehaviorSubject<string | null>(null),
  customEntities: new BehaviorSubject<CustomEntity[]>([
    {
      paragraphId: 'fe5cc983ded4330f65ae992f58d85fcf/f/fe5cc983ded4330f65ae992f58d85fcf/0-169',
      entityFamilyId: 'idea',
      entity: 'idea',
      start: 19,
      end: 25,
    },
    {
      paragraphId: 'fe5cc983ded4330f65ae992f58d85fcf/f/fe5cc983ded4330f65ae992f58d85fcf/0-169',
      entityFamilyId: 'idea',
      entity: 'idea',
      start: 54,
      end: 59,
    },
    {
      paragraphId: 'fe5cc983ded4330f65ae992f58d85fcf/f/fe5cc983ded4330f65ae992f58d85fcf/1318-1421',
      entityFamilyId: 'idea',
      entity: 'idea',
      start: 19,
      end: 23,
    },
  ]),
};

export function addCustomEntity(entity: CustomEntity) {
  const entities = annotationStore.customEntities.getValue();
  annotationStore.customEntities.next(entities.concat([entity]));
}

export function removeCustomEntity(entityToRemove: CustomEntity) {
  const entities = annotationStore.customEntities.getValue();
  const indexToRemove = entities.findIndex((entity) => isEqual(entity, entityToRemove));
  if (indexToRemove > -1) {
    entities.splice(indexToRemove, 1);
    annotationStore.customEntities.next(entities);
  }
}

export function updateCustomEntity(previousEntity: CustomEntity, newState: CustomEntity) {
  const entities = annotationStore.customEntities.getValue();
  const indexToUpdate = entities.findIndex((entity) => isEqual(entity, previousEntity));
  if (indexToUpdate > -1) {
    entities[indexToUpdate] = newState;
    annotationStore.customEntities.next(entities);
  }
}

function isEqual(a: CustomEntity, b: CustomEntity): boolean {
  return (
    a.paragraphId === b.paragraphId &&
    a.entityFamilyId === b.entityFamilyId &&
    a.entity === b.entity &&
    a.start === b.start &&
    a.end === b.end
  );
}
