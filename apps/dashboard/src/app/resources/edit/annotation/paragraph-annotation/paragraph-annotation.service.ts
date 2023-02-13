import { Injectable } from '@angular/core';
import {
  EntityAnnotation,
  EntityGroup,
  getAllAnnotations,
  getAnnotatedText,
  getHighlightedAnnotations,
  getParagraphAnnotations,
  getParagraphs,
  isSameAnnotation,
  ParagraphWithTextAndAnnotations,
  sortByPosition,
} from '../../edit-resource.helpers';
import { EditResourceService } from '../../edit-resource.service';
import { FieldId, Paragraph, Resource } from '@nuclia/core';
import { ParagraphService } from '../../paragraph.service';
import { BehaviorSubject, Observable } from 'rxjs';

export interface EntityAnnotationWithPid extends EntityAnnotation {
  paragraphId: string;
}

@Injectable({
  providedIn: 'root',
})
export class ParagraphAnnotationService extends ParagraphService {
  paragraphs: Observable<ParagraphWithTextAndAnnotations[]> = this.paragraphList as Observable<
    ParagraphWithTextAndAnnotations[]
  >;

  private _selectedFamily: BehaviorSubject<EntityGroup | null> = new BehaviorSubject<EntityGroup | null>(null);

  selectedFamily: Observable<EntityGroup | null> = this._selectedFamily.asObservable();
  get selectedFamilyValue() {
    return this._selectedFamily.value;
  }

  constructor(private editResource: EditResourceService) {
    super();
  }

  initParagraphs(fieldId: FieldId, resource: Resource, families: EntityGroup[]) {
    const paragraphs: ParagraphWithTextAndAnnotations[] = this.getEnhancedParagraphs(fieldId, resource, families);
    this.setupParagraphs(paragraphs);
  }

  resetParagraphs() {
    super.resetParagraphs();
    if (this.selectedFamilyValue) {
      this.updateParagraphsWithAnnotations();
    }
  }

  selectFamily(family: EntityGroup) {
    const selectedFamily = this.selectedFamilyValue?.id === family.id ? null : family;
    this._selectedFamily.next(selectedFamily);
    this.updateParagraphsWithAnnotations();
  }

  resetFamily() {
    this._selectedFamily.next(null);
  }

  addEntity(paragraph: ParagraphWithTextAndAnnotations, selection: EntityAnnotationWithPid) {
    paragraph.annotations.push(selection);
    paragraph.annotations.sort(sortByPosition);
    this.updateParagraphsWithAnnotations();
  }

  updateEntity(paragraph: ParagraphWithTextAndAnnotations, selection: EntityAnnotationWithPid) {
    const family = this.selectedFamilyValue;
    if (!family) {
      return;
    }
    const newEntity = {
      start: selection.start,
      end: selection.end,
      klass: family.id,
      token: selection.token,
      family: family.title,
    };
    if (selection.immutable) {
      paragraph.annotations.push(
        {
          ...selection,
          immutable: false,
          cancelled_by_user: true,
        },
        newEntity,
      );
    } else {
      const annotationIndex = paragraph.annotations.findIndex((annotation) => isSameAnnotation(annotation, selection));
      if (annotationIndex > -1) {
        paragraph.annotations[annotationIndex] = newEntity;
      }
    }
    paragraph.annotations.sort(sortByPosition);
    this.updateParagraphsWithAnnotations();
  }

  removeEntityFromParagraph(paragraph: ParagraphWithTextAndAnnotations, selection: EntityAnnotationWithPid) {
    if (selection.immutable) {
      paragraph.annotations.push({
        ...selection,
        cancelled_by_user: true,
        immutable: false,
      });
    } else {
      const annotationIndex = paragraph.annotations.findIndex((annotation) => isSameAnnotation(annotation, selection));
      if (annotationIndex > -1) {
        paragraph.annotations.splice(annotationIndex, 1);
      }
    }
    this.updateParagraphsWithAnnotations();
  }

  private getEnhancedParagraphs(
    fieldId: FieldId,
    resource: Resource,
    families: EntityGroup[],
  ): ParagraphWithTextAndAnnotations[] {
    const allAnnotations = getAllAnnotations(resource, fieldId, families);
    const paragraphs: Paragraph[] = getParagraphs(fieldId, resource);
    return paragraphs.map((paragraph) => {
      const paragraphId = this.editResource.getParagraphId(fieldId, paragraph);
      const allParagraphAnnotations = getParagraphAnnotations(allAnnotations, paragraph);
      const highlightedAnnotation = getHighlightedAnnotations(allParagraphAnnotations);
      const paragraphText = resource.getParagraphText(fieldId.field_type, fieldId.field_id, paragraph);
      const enhancedParagraph: ParagraphWithTextAndAnnotations = {
        ...paragraph,
        paragraphId,
        text: paragraphText,
        annotatedText: getAnnotatedText(paragraphId, paragraphText, highlightedAnnotation),
        annotations: allParagraphAnnotations,
      };
      return enhancedParagraph;
    });
  }

  updateParagraphsWithAnnotations() {
    this._allParagraphs.next(
      (this._allParagraphs.value as ParagraphWithTextAndAnnotations[]).map((paragraph) => {
        const highlightedAnnotations = getHighlightedAnnotations(paragraph.annotations);
        return {
          ...paragraph,
          annotatedText: getAnnotatedText(
            paragraph.paragraphId,
            paragraph.text,
            highlightedAnnotations,
            this.selectedFamilyValue,
          ),
        };
      }),
    );
  }
}
