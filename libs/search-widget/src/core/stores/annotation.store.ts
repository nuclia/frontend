import { BehaviorSubject } from 'rxjs';
import type { Resource, TokenAnnotation } from '@nuclia/core';
import type { WidgetParagraph } from '../models';
import { getParagraphId } from './viewer.store';

export type Annotation = {
  paragraphId: string;
  entityFamilyId: string;
  entity: string;
  start: number;
  end: number;
  paragraphStart: number;
};

export type AnnotationStore = {
  annotationMode: BehaviorSubject<boolean>;
  selectedFamily: BehaviorSubject<string | null>;
  annotations: BehaviorSubject<Annotation[]>;
  setAnnotations: (
    resource: Resource,
    paragraphs: WidgetParagraph[],
    currentField: { field_type: string; field_id: string },
  ) => void;
};

export const annotationStore: AnnotationStore = {
  annotationMode: new BehaviorSubject(false),
  selectedFamily: new BehaviorSubject<string | null>(null),
  annotations: new BehaviorSubject<Annotation[]>([]),
  setAnnotations,
};

export function setAnnotations(
  resource: Resource,
  paragraphs: WidgetParagraph[],
  currentField: { field_type: string; field_id: string },
) {
  const fieldMetadata = (resource.fieldmetadata || []).filter(
    (userFieldMetadata) =>
      !!userFieldMetadata.token &&
      userFieldMetadata.field.field === currentField.field_id &&
      userFieldMetadata.field.field_type === currentField.field_type,
  );
  if (fieldMetadata.length > 1) {
    throw new Error(`Annotations on several fields of resource ${resource.id}`);
  }
  const tokens: TokenAnnotation[] = fieldMetadata[0]?.token || [];
  const annotations: Annotation[] = tokens.map((token) => {
    const paragraph = paragraphs.find((p) => token.start >= p.start && token.end <= p.end);
    if (!paragraph) {
      throw new Error(`Paragraph not found for token ${JSON.stringify(token)}`);
    }
    return {
      entityFamilyId: token.klass,
      entity: token.token,
      paragraphId: getParagraphId(resource.id, paragraph),
      paragraphStart: paragraph.start,
      start: token.start - paragraph.start,
      end: token.end - paragraph.start,
    };
  });
  annotationStore.annotations.next(annotations);
}

export function addAnnotation(entity: Annotation) {
  const entities = annotationStore.annotations.getValue();
  annotationStore.annotations.next(entities.concat([entity]));
}

export function removeAnnotation(entityToRemove: Annotation) {
  const entities = annotationStore.annotations.getValue();
  const indexToRemove = entities.findIndex((entity) => isEqual(entity, entityToRemove));
  if (indexToRemove > -1) {
    entities.splice(indexToRemove, 1);
    annotationStore.annotations.next(entities);
  }
}

export function updateAnnotation(previousEntity: Annotation, newState: Annotation) {
  const entities = annotationStore.annotations.getValue();
  const indexToUpdate = entities.findIndex((entity) => isEqual(entity, previousEntity));
  if (indexToUpdate > -1) {
    entities[indexToUpdate] = newState;
    annotationStore.annotations.next(entities);
  }
}

function isEqual(a: Annotation, b: Annotation): boolean {
  return (
    a.paragraphId === b.paragraphId &&
    a.entityFamilyId === b.entityFamilyId &&
    a.entity === b.entity &&
    a.start === b.start &&
    a.end === b.end &&
    a.paragraphStart === b.paragraphStart
  );
}
