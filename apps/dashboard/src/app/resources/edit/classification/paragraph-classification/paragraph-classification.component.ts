import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EditResourceService } from '../../edit-resource.service';
import { combineLatest, filter, forkJoin, map, Observable, Subject, switchMap, take } from 'rxjs';
import { Classification, FieldId, LabelSetKind, LabelSets, longToShortFieldType, Resource, Search } from '@nuclia/core';
import { LabelsService } from '../../../../services/labels.service';
import { ParagraphWithTextAndClassifications } from '../../edit-resource.helpers';
import { ParagraphClassificationService } from './paragraph-classification.service';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-paragraph-label-sets',
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

  availableLabels: Observable<LabelSets | null> = this.labelsService.getLabelsByKind(LabelSetKind.PARAGRAPHS);
  hasLabels: Observable<boolean> = this.availableLabels.pipe(
    map((labels) => !!labels && Object.keys(labels).length > 0),
  );
  currentLabel?: Classification;
  isModified = false;
  isSaving = false;

  paragraphs: Observable<ParagraphWithTextAndClassifications[]> = this.classificationService.paragraphs;
  kbUrl = this.editResource.kbUrl;

  searchQuery = '';

  constructor(
    private route: ActivatedRoute,
    private editResource: EditResourceService,
    private classificationService: ParagraphClassificationService,
    private labelsService: LabelsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.editResource.setCurrentView('classification');

    combineLatest([this.fieldId, this.resource])
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(([fieldId, resource]) => this.classificationService.initParagraphs(fieldId, resource));
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
    this.classificationService.cleanup();
  }

  updateSelection(labels: Classification[]) {
    this.currentLabel = labels[0];
  }

  addLabelOnParagraph(paragraph: ParagraphWithTextAndClassifications) {
    if (this.currentLabel) {
      this.classificationService.classifyParagraph(this.currentLabel, paragraph);
      this.isModified = this.classificationService.hasModifications();
    }
  }

  cancelGeneratedLabel(paragraph: ParagraphWithTextAndClassifications, labelToCancel: Classification) {
    this.classificationService.cancelGeneratedLabel(paragraph, labelToCancel);
    this.isModified = this.classificationService.hasModifications();
  }

  removeUserLabel(paragraph: ParagraphWithTextAndClassifications, labelToRemove: Classification) {
    this.classificationService.removeUserLabel(paragraph, labelToRemove);
    this.isModified = this.classificationService.hasModifications();
  }

  save() {
    this.isSaving = true;
    forkJoin([this.fieldId.pipe(take(1)), this.paragraphs.pipe(take(1))])
      .pipe(
        switchMap(([field, paragraphs]) => this.editResource.saveClassifications(field, paragraphs)),
        take(1),
      )
      .subscribe({
        next: () => {
          this.isModified = false;
          this.isSaving = false;
          this.cdr.markForCheck();
        },
        error: () => (this.isSaving = false),
      });
  }

  cancel() {
    this.classificationService.resetParagraphs();
    this.isModified = false;
  }

  triggerSearch() {
    const query = this.searchQuery;
    if (query) {
      forkJoin([this.fieldId.pipe(take(1)), this.resource.pipe(take(1))])
        .pipe(
          switchMap(([field, resource]) =>
            resource.search(query, [Search.ResourceFeatures.PARAGRAPH], {
              fields: [`${longToShortFieldType(field.field_type)}/${field.field_id}`],
            }),
          ),
        )
        .subscribe((results) => this.classificationService.setSearchResults(results));
    }
  }

  onSearchInputClick($event: MouseEvent) {
    const target = $event.target as HTMLElement;
    // Reset search query when clicking on the icon
    if (this.searchQuery && (target.nodeName === 'svg' || target.parentElement?.nodeName === 'svg')) {
      $event.stopPropagation();
      $event.preventDefault();
      this.searchQuery = '';
      this.classificationService.setSearchResults(null);
      this.cdr.markForCheck();
    }
  }
}
