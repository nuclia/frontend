import { Injectable } from '@angular/core';
import { getParagraphs, ParagraphWithTextAndClassifications } from '../../edit-resource.helpers';
import { EditResourceService } from '../../edit-resource.service';
import { Classification, FieldId, Paragraph, Resource, UserClassification } from '@nuclia/core';
import { ParagraphService } from '../../paragraph.service';
import { Observable } from 'rxjs';

type ParagraphClassificationMap = { [paragraphId: string]: UserClassification[] };

@Injectable({
  providedIn: 'root',
})
export class ParagraphClassificationService extends ParagraphService {
  private _paragraphClassificationMap: ParagraphClassificationMap = {};

  paragraphs: Observable<ParagraphWithTextAndClassifications[]> = this.paragraphList as Observable<
    ParagraphWithTextAndClassifications[]
  >;

  constructor(private editResource: EditResourceService) {
    super();
  }

  initParagraphs(fieldId: FieldId, resource: Resource) {
    const paragraphs: ParagraphWithTextAndClassifications[] = this.getEnhancedParagraphs(fieldId, resource);
    this.setupParagraphs(paragraphs);
  }

  /**
   * Add label on paragraph
   * If same generated classification exists and was cancelled by the user, we remove the cancellation
   * If no generated nor user classification exists, we add classification
   * @param classification
   * @param paragraph
   * @param multiple
   */
  classifyParagraph(classification: Classification, paragraph: ParagraphWithTextAndClassifications, multiple: boolean) {
    if (!multiple) {
      this.removeAndCancelLabelsByLabelSet(classification.labelset, paragraph);
    }

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
    this._paragraphClassificationMap = this.getParagraphClassificationMap(resource, fieldId);
    const paragraphs: Paragraph[] = getParagraphs(fieldId, resource);
    return paragraphs.map((paragraph) => {
      const paragraphId = this.editResource.getParagraphId(fieldId, paragraph);
      const userClassifications = this._paragraphClassificationMap[paragraphId] || [];
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
   * Remove/cancel all labels belonging to a label set
   */
  private removeAndCancelLabelsByLabelSet(labelSet: string, paragraph: ParagraphWithTextAndClassifications) {
    paragraph.userClassifications = paragraph.userClassifications.filter(
      (label) => !(label.labelset === labelSet && !label.cancelled_by_user),
    );
    paragraph.userClassifications.push(
      ...paragraph.generatedClassifications
        .filter((label) => label.labelset === labelSet)
        .map((label) => ({ ...label, cancelled_by_user: true })),
    );
    paragraph.generatedClassifications = this.getGeneratedClassification(paragraph, paragraph.userClassifications);
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
