import { BehaviorSubject } from 'rxjs';
import type { EntityGroup } from '../../core/models';

export type CustomEntity = {
  paragraphId: string;
  entityFamilyId: string;
  start: number;
  end: number;
};

export type AnnotationStore = {
  annotationMode: BehaviorSubject<boolean>;
  selectedGroup: BehaviorSubject<EntityGroup | null>;
  customEntities: BehaviorSubject<CustomEntity[]>;
};

export const annotationStore: AnnotationStore = {
  annotationMode: new BehaviorSubject(false),
  selectedGroup: new BehaviorSubject<EntityGroup | null>(null),
  customEntities: new BehaviorSubject<CustomEntity[]>([
    {
      paragraphId: 'fe5cc983ded4330f65ae992f58d85fcf/f/fe5cc983ded4330f65ae992f58d85fcf/0-169',
      entityFamilyId: 'idea',
      start: 19,
      end: 25,
    },
    {
      paragraphId: 'fe5cc983ded4330f65ae992f58d85fcf/f/fe5cc983ded4330f65ae992f58d85fcf/0-169',
      entityFamilyId: 'idea',
      start: 54,
      end: 59,
    },
    {
      paragraphId: 'fe5cc983ded4330f65ae992f58d85fcf/f/fe5cc983ded4330f65ae992f58d85fcf/1318-1421',
      entityFamilyId: 'idea',
      start: 19,
      end: 23,
    },
  ]),
};
