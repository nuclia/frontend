import type { Resource, TokenAnnotation } from '@nuclia/core';
import type { WidgetParagraph } from '../models';
import { writableSubject } from '../state-lib';
import { map } from 'rxjs';
import { getParagraphId } from '../utils';

export type Annotation = {
  paragraphId: string;
  entityFamilyId: string;
  entity: string;
  start: number;
  end: number;
  paragraphStart: number;
};

export const annotationMode = writableSubject(false);
export const annotations = writableSubject<Annotation[]>([]);
export const sortedAnnotations = annotations.pipe(
  map(($annotations) =>
    $annotations.sort((a, b) => {
      if (a.start < b.start) {
        return -1;
      } else if (a.start > b.start) {
        return 1;
      } else {
        return 0;
      }
    }),
  ),
);

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
  const annotationList: Annotation[] = tokens.map((token) => {
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
  annotations.set(annotationList);
}

export function addAnnotation(entity: Annotation) {
  annotations.update((entities) => entities.concat([entity]));
}

export function removeAnnotation(entityToRemove: Annotation) {
  annotations.update((entities) => {
    const indexToRemove = entities.findIndex((entity) => isEqual(entity, entityToRemove));
    if (indexToRemove > -1) {
      entities.splice(indexToRemove, 1);
    }
    return entities;
  });
}

export function updateAnnotation(entityToUpdate: Annotation, newState: Annotation) {
  annotations.update((entities) => {
    const indexToUpdate = entities.findIndex((entity) => isEqual(entity, entityToUpdate));
    if (indexToUpdate > -1) {
      entities[indexToUpdate] = newState;
    }
    return entities;
  });
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
