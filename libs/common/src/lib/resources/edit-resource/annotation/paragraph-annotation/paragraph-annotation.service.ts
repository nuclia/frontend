import { Injectable } from '@angular/core';
import {
  EntityGroup,
  getAnnotatedText,
  getGeneratedFieldAnnotations,
  getHighlightedAnnotations,
  getParagraphAnnotations,
  getParagraphs,
  ParagraphWithTextAndAnnotations,
} from '../../edit-resource.helpers';
import { EditResourceService } from '../../edit-resource.service';
import { FieldId, Paragraph, Resource } from '@nuclia/core';
import { ParagraphService } from '../../paragraph.service';
import { BehaviorSubject, Observable } from 'rxjs';

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

  selectFamily(family: EntityGroup) {
    const selectedFamily = this.selectedFamilyValue?.id === family.id ? null : family;
    this._selectedFamily.next(selectedFamily);
    this.updateParagraphsWithAnnotations();
  }

  private getEnhancedParagraphs(
    fieldId: FieldId,
    resource: Resource,
    families: EntityGroup[],
  ): ParagraphWithTextAndAnnotations[] {
    const annotations = getGeneratedFieldAnnotations(resource, fieldId, families);
    const paragraphs: Paragraph[] = getParagraphs(fieldId, resource);
    return paragraphs.map((paragraph) => {
      const paragraphId = this.editResource.getParagraphId(fieldId, paragraph);
      const allParagraphAnnotations = getParagraphAnnotations(annotations, paragraph, families);
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
