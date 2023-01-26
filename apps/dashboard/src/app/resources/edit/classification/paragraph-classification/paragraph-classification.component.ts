import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EditResourceService } from '../../edit-resource.service';
import { combineLatest, filter, map, Observable, Subject, switchMap, tap } from 'rxjs';
import {
  Classification,
  FieldId,
  LabelSetKind,
  LabelSets,
  Paragraph,
  Resource,
  UserClassification,
} from '@nuclia/core';
import { LabelsService } from '../../../../services/labels.service';
import { getParagraphs, ParagraphWithTextAndClassifications } from '../../edit-resource.helpers';

type ParagraphClassificationMap = { [paragraphId: string]: UserClassification[] };

@Component({
  selector: 'app-paragraph-classification',
  templateUrl: './paragraph-classification.component.html',
  styleUrls: ['./paragraph-classification.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParagraphClassificationComponent implements OnInit, OnDestroy {
  unsubscribeAll = new Subject<void>();

  private resource: Observable<Resource> = this.editResource.resource.pipe(
    filter((resource) => !!resource),
    map((resource) => resource as Resource),
  );
  private fieldId: Observable<FieldId> = this.route.params.pipe(
    filter((params) => !!params.fieldType && !!params.fieldId),
    map((params) => {
      const field: FieldId = { field_id: params.fieldId, field_type: params.fieldType };
      this.editResource.setCurrentField(field);
      return field;
    }),
  );
  private paragraphClassificationMap: ParagraphClassificationMap = {};

  availableLabels: Observable<LabelSets | null> = this.labelsService.getLabelsByKind(LabelSetKind.PARAGRAPHS);
  currentLabel?: Classification;
  isModified = false;
  isSaving = false;

  private paragraphsBackup: ParagraphWithTextAndClassifications[] = [];
  paragraphs: ParagraphWithTextAndClassifications[] = [];

  constructor(
    private route: ActivatedRoute,
    private editResource: EditResourceService,
    private labelsService: LabelsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.editResource.setCurrentView('classification');
    combineLatest([this.fieldId, this.resource])
      .pipe(
        tap(([fieldId, resource]) => {
          this.paragraphClassificationMap = this.getParagraphClassificationMap(resource, fieldId);
        }),
        map(([fieldId, resource]) => {
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
        }),
      )
      .subscribe((paragraphs) => {
        this.paragraphsBackup = paragraphs.map((paragraph) => JSON.parse(JSON.stringify(paragraph)));
        this.paragraphs = this.paragraphsBackup.map((paragraph) => JSON.parse(JSON.stringify(paragraph)));
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  updateSelection(labels: Classification[]) {
    this.currentLabel = labels[0];
  }

  addLabelOnParagraph(paragraph: ParagraphWithTextAndClassifications) {
    if (this.currentLabel) {
      const currentLabel = this.currentLabel;
      let existingIndex = -1;
      const existing = paragraph.userClassifications.find((label, index) => {
        const found = label.label === currentLabel.label && label.labelset === currentLabel.labelset;
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
          (label) => label.label === currentLabel.label && label.labelset === currentLabel.labelset,
        )
      ) {
        paragraph.userClassifications.push(currentLabel);
      }
      this.isModified = this.hasModifications();
    }
  }

  cancelGeneratedLabel(paragraph: ParagraphWithTextAndClassifications, labelToCancel: Classification) {
    paragraph.userClassifications.push({ ...labelToCancel, cancelled_by_user: true });
    paragraph.generatedClassifications = this.getGeneratedClassification(paragraph, paragraph.userClassifications);
    this.isModified = this.hasModifications();
  }

  removeUserLabel(paragraph: ParagraphWithTextAndClassifications, labelToRemove: Classification) {
    paragraph.userClassifications = paragraph.userClassifications.filter(
      (label) => !(label.labelset === labelToRemove.labelset && label.label === labelToRemove.label),
    );
    this.isModified = this.hasModifications();
  }

  save() {
    this.isSaving = true;
    this.fieldId.pipe(switchMap((field) => this.editResource.saveClassifications(field, this.paragraphs))).subscribe({
      next: () => {
        this.isModified = false;
        this.isSaving = false;
        this.cdr.markForCheck();
      },
      error: () => (this.isSaving = false),
    });
  }

  cancel() {
    this.paragraphs = this.paragraphsBackup.map((paragraph) => JSON.parse(JSON.stringify(paragraph)));
    this.isModified = false;
  }

  private hasModifications() {
    return JSON.stringify(this.paragraphsBackup) !== JSON.stringify(this.paragraphs);
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
