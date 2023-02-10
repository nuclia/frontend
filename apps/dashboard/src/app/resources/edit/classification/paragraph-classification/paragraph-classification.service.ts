import { Injectable } from '@angular/core';
import { getParagraphs, ParagraphWithTextAndClassifications } from '../../edit-resource.helpers';
import { BehaviorSubject, Observable } from 'rxjs';
import { EditResourceService } from '../../edit-resource.service';
import { Classification, FieldId, Paragraph, Resource, UserClassification } from '@nuclia/core';
import { cloneDeep } from '@flaps/common';

type ParagraphClassificationMap = { [paragraphId: string]: UserClassification[] };

@Injectable({
  providedIn: 'root',
})
export class ParagraphClassificationService {
  private _paragraphsBackup: BehaviorSubject<ParagraphWithTextAndClassifications[]> = new BehaviorSubject<
    ParagraphWithTextAndClassifications[]
  >([]);
  private _paragraphs: BehaviorSubject<ParagraphWithTextAndClassifications[]> = new BehaviorSubject<
    ParagraphWithTextAndClassifications[]
  >([]);
  private paragraphClassificationMap: ParagraphClassificationMap = {};

  paragraphs: Observable<ParagraphWithTextAndClassifications[]> = this._paragraphs.asObservable();

  constructor(private editResource: EditResourceService) {}

  initParagraphs(fieldId: FieldId, resource: Resource) {
    const paragraphs: ParagraphWithTextAndClassifications[] = this.getEnhancedParagraphs(fieldId, resource);
    this._paragraphsBackup.next(paragraphs);
    this._paragraphs.next(cloneDeep(paragraphs));
  }

  resetParagraphs() {
    this._paragraphs.next(cloneDeep(this._paragraphsBackup.value));
  }

  hasModifications(): boolean {
    return JSON.stringify(this._paragraphsBackup.value) !== JSON.stringify(this._paragraphs.value);
  }

  /**
   * Add label on paragraph
   * If same generated classification exists and was cancelled by the user, we remove the cancellation
   * If no generated nor user classification exists, we add classification
   * @param classification
   * @param paragraph
   */
  classifyParagraph(classification: Classification, paragraph: ParagraphWithTextAndClassifications) {
    let existingIndex = -1;
    const existing = paragraph.userClassifications.find((label, index) => {
      const found = label.label === classification.label && label.labelset === classification.labelset;
      if (found) {
        existingIndex = index;
      }
      return found;
    });
    if (existing && existing.cancelled_by_user) {
      paragraph.userClassifications.splice(existingIndex, 1);
      paragraph.generatedClassifications = this.getGeneratedClassification(paragraph, paragraph.userClassifications);
    }
    if (
      !existing &&
      !paragraph.generatedClassifications.find(
        (label) => label.label === classification.label && label.labelset === classification.labelset,
      )
    ) {
      paragraph.userClassifications.push(classification);
    }
  }

  /**
   * Cancel generated label by adding a similar user label with `cancelled_by_user: true`
   * @param paragraph
   * @param labelToCancel
   */
  cancelGeneratedLabel(paragraph: ParagraphWithTextAndClassifications, labelToCancel: Classification) {
    paragraph.userClassifications.push({ ...labelToCancel, cancelled_by_user: true });
    paragraph.generatedClassifications = this.getGeneratedClassification(paragraph, paragraph.userClassifications);
  }

  /**
   * Remove user label from user classification
   * @param paragraph
   * @param labelToRemove
   */
  removeUserLabel(paragraph: ParagraphWithTextAndClassifications, labelToRemove: Classification) {
    paragraph.userClassifications = paragraph.userClassifications.filter(
      (label) => !(label.labelset === labelToRemove.labelset && label.label === labelToRemove.label),
    );
  }

  private getEnhancedParagraphs(fieldId: FieldId, resource: Resource): ParagraphWithTextAndClassifications[] {
    this.paragraphClassificationMap = this.getParagraphClassificationMap(resource, fieldId);
    const paragraphs: Paragraph[] = getParagraphs(fieldId, resource);
    return paragraphs.map((paragraph) => {
      const paragraphId = this.editResource.getParagraphId(fieldId, paragraph);
      const userClassifications = this.paragraphClassificationMap[paragraphId] || [];
      const enhancedParagraph: ParagraphWithTextAndClassifications = {
        ...paragraph,
        text: resource.getParagraphText(fieldId.field_type, fieldId.field_id, paragraph),
        paragraphId,
        userClassifications,
        generatedClassifications: this.getGeneratedClassification(paragraph, userClassifications),
      };
      return enhancedParagraph;
    });
  }

  private getParagraphClassificationMap(resource: Resource, fieldId: FieldId): ParagraphClassificationMap {
    return (resource.fieldmetadata || []).reduce((annotationMap, userFieldMetadata) => {
      if (
        userFieldMetadata.field.field === fieldId.field_id &&
        userFieldMetadata.field.field_type === fieldId.field_type
      ) {
        annotationMap = {
          ...annotationMap,
          ...(userFieldMetadata.paragraphs || []).reduce((paragraphAnnotations, annotation) => {
            paragraphAnnotations[annotation.key] = annotation.classifications;
            return paragraphAnnotations;
          }, {} as ParagraphClassificationMap),
        };
      }
      return annotationMap;
    }, {} as ParagraphClassificationMap);
  }

  /**
   * Returns labels generated by the backend which weren't cancelled by the user
   */
  private getGeneratedClassification(
    paragraph: Paragraph,
    userClassifications: UserClassification[],
  ): Classification[] {
    return (paragraph.classifications || []).filter(
      (classification) =>
        !userClassifications.find(
          (userClassification) =>
            userClassification.cancelled_by_user &&
            userClassification.labelset === classification.labelset &&
            userClassification.label === classification.label,
        ),
    );
  }
}
