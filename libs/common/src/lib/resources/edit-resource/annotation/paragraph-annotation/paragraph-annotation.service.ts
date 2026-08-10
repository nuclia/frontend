import { Injectable } from '@angular/core';
import {
  EntityGroup,
  getAnnotatedText,
  getGeneratedFieldAnnotations,
  getHighlightedAnnotations,
  getParagraphAnnotations,
  getParagraphText,
  ParagraphWithTextAndAnnotations,
} from '../../edit-resource.helpers';
import { EditResourceService } from '../../edit-resource.service';
import { FieldId, IFieldData, Paragraph } from '@nuclia/core';
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

  initParagraphsWithAnnotations(fieldId: FieldId, fieldData: IFieldData, families: EntityGroup[]) {
    const paragraphs: ParagraphWithTextAndAnnotations[] = this.getEnhancedParagraphs(fieldId, fieldData, families);
    this.setupParagraphs(paragraphs);
  }

  selectFamily(family: EntityGroup) {
    const selectedFamily = this.selectedFamilyValue?.id === family.id ? null : family;
    this._selectedFamily.next(selectedFamily);
    this.updateParagraphsWithAnnotations();
  }

  private getEnhancedParagraphs(
    fieldId: FieldId,
    fieldData: IFieldData,
    families: EntityGroup[],
  ): ParagraphWithTextAndAnnotations[] {
    const annotations = getGeneratedFieldAnnotations(fieldData, families);
    const paragraphs: Paragraph[] = fieldData.extracted?.metadata?.metadata?.paragraphs || [];
    const fieldText = Array.from(fieldData?.extracted?.text?.text || '');
    return paragraphs.map((paragraph) => {
      const paragraphId = this.editResource.getParagraphId(fieldId, paragraph);
      const allParagraphAnnotations = getParagraphAnnotations(annotations, paragraph, families);
      const highlightedAnnotation = getHighlightedAnnotations(allParagraphAnnotations);
      const paragraphText = getParagraphText(fieldText, paragraph);
      const enhancedParagraph: ParagraphWithTextAndAnnotations = {
        ...paragraph,
        paragraphId,
        text: paragraphText,
        annotatedText: getAnnotatedText(paragraphText, highlightedAnnotation),
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
          annotatedText: getAnnotatedText(paragraph.text, highlightedAnnotations, this.selectedFamilyValue),
        };
      }),
    );
  }
}
