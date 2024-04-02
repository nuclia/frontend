import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EditResourceService } from '../../edit-resource.service';
import { BehaviorSubject, combineLatest, filter, forkJoin, map, Observable, Subject, switchMap, take, tap } from 'rxjs';
import { Classification, FieldId, LabelSets, Resource, Search } from '@nuclia/core';
import { LabelsService } from '@flaps/core';
import { ParagraphWithTextAndClassifications } from '../../edit-resource.helpers';
import { ParagraphClassificationService } from './paragraph-classification.service';
import { takeUntil } from 'rxjs/operators';
import { getClassificationFromSelection } from '@nuclia/sistema';

@Component({
  templateUrl: './paragraph-classification.component.html',
  styleUrls: ['../../common-page-layout.scss', './paragraph-classification.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParagraphClassificationComponent implements OnInit, OnDestroy {
  unsubscribeAll = new Subject<void>();

  private resource: Observable<Resource> = this.editResource.resource.pipe(
    filter((resource) => !!resource),
    map((resource) => resource as Resource),
  );
  private fieldId: Observable<FieldId> = this.route.params.pipe(
    filter((params) => !!params['fieldType'] && !!params['fieldId']),
    map((params) => {
      const field: FieldId = { field_id: params['fieldId'], field_type: params['fieldType'] };
      this.editResource.setCurrentField(field);
      return field;
    }),
  );

  currentSelection: { [id: string]: boolean } = {};
  availableLabels: Observable<LabelSets | null> = this.labelsService.textBlockLabelSets;
  hasLabels: Observable<boolean> = this.availableLabels.pipe(
    map((labels) => !!labels && Object.keys(labels).length > 0),
    tap(() => {
      this.labelLoaded = true;
      this.cdr.markForCheck();
    }),
  );
  currentLabels: BehaviorSubject<Classification[]> = new BehaviorSubject<Classification[]>([]);
  emptyLabelSelection = this.currentLabels.pipe(
    map((labels) => {
      return labels.length === 0;
    }),
  );
  isModified = false;
  isSaving = false;
  labelLoaded = false;

  paragraphs: Observable<ParagraphWithTextAndClassifications[]> = this.classificationService.paragraphs;
  hasParagraph: Observable<boolean> = this.classificationService.hasParagraph;
  paragraphLoaded: Observable<boolean> = this.classificationService.paragraphLoaded;
  kbUrl = this.editResource.kbUrl;

  previousQuery?: string;
  searchQuery = '';
  hasMoreResults = false;
  nextPageNumber = 0;
  isAdminOrContrib = this.editResource.isAdminOrContrib;

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

  updateSelection(newSelection: { [id: string]: boolean }) {
    this.currentLabels.next(getClassificationFromSelection(newSelection));
    this.currentSelection = newSelection;
  }

  cleanUpLabels() {
    this.currentLabels.next([]);
    this.currentSelection = Object.keys(this.currentSelection).reduce(
      (newSelection, key) => {
        newSelection[key] = false;
        return newSelection;
      },
      {} as { [id: string]: boolean },
    );
    this.cdr.markForCheck();
  }

  removeLabelFromSelection(classificationToRemove: Classification) {
    this.currentLabels.next(
      this.currentLabels.value.filter(
        (item) => !(item.labelset === classificationToRemove.labelset && item.label === classificationToRemove.label),
      ),
    );
  }

  addLabelsOnParagraph(paragraph: ParagraphWithTextAndClassifications) {
    this.availableLabels.pipe(take(1)).subscribe((labelSets) => {
      this.currentLabels.value.forEach((label) => {
        this.classificationService.classifyParagraph(label, paragraph, !!labelSets?.[label.labelset]?.multiple);
      });
      this.isModified = this.classificationService.hasModifications();
    });
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
    // Reset pagination on new query
    if (this.previousQuery !== this.searchQuery) {
      this.previousQuery = this.searchQuery;
      this.nextPageNumber = 0;
    }
    this._triggerSearch(this.searchQuery).subscribe((results) => {
      this.classificationService.setSearchResults(results);
      this.updatePagination(results);
    });
  }

  onSearchInputClick($event: MouseEvent) {
    const target = $event.target as HTMLElement;
    // Reset search query when clicking on the icon
    if (this.searchQuery && (target.nodeName === 'svg' || target.parentElement?.nodeName === 'svg')) {
      $event.stopPropagation();
      $event.preventDefault();
      this.searchQuery = '';
      this.classificationService.setSearchResults(null);
      this.hasMoreResults = false;
      this.nextPageNumber = 0;
      this.cdr.markForCheck();
    }
  }

  loadMore() {
    if (this.hasMoreResults && this.searchQuery) {
      this._triggerSearch(this.searchQuery).subscribe((results) => {
        this.classificationService.appendSearchResults(results);
        this.updatePagination(results);
      });
    }
  }

  private updatePagination(results: Search.Results) {
    if (results.paragraphs) {
      this.hasMoreResults = results.paragraphs.next_page;
      this.nextPageNumber = results.paragraphs.page_number + 1;
    }
  }

  private _triggerSearch(query: string) {
    return forkJoin([this.fieldId.pipe(take(1)), this.resource.pipe(take(1))]).pipe(
      switchMap(([field, resource]) =>
        this.classificationService.searchInField(query, resource, field, this.nextPageNumber),
      ),
    );
  }
}
