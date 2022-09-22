import { BehaviorSubject } from 'rxjs';
import type { EntityGroup } from '../../core/models';

export type AnnotationStore = {
  annotationMode: BehaviorSubject<boolean>;
  selectedGroup: BehaviorSubject<EntityGroup | null>;
};

export const annotationStore: AnnotationStore = {
  annotationMode: new BehaviorSubject(false),
  selectedGroup: new BehaviorSubject<EntityGroup | null>(null),
};
