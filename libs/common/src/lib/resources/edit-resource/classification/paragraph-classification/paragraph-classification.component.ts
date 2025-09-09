import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EditResourceService } from '../../edit-resource.service';
import { combineLatest, filter, forkJoin, map, Observable, Subject, switchMap, take } from 'rxjs';
import { FieldId, LabelSets, Resource, Search } from '@nuclia/core';
import { LabelsService } from '@flaps/core';
import { ParagraphWithTextAndClassifications } from '../../edit-resource.helpers';
import { takeUntil } from 'rxjs/operators';
import { ParagraphService } from '../../paragraph.service';

@Component({
  templateUrl: './paragraph-classification.component.html',
  styleUrls: ['../../common-page-layout.scss', './paragraph-classification.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
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

  availableLabels: Observable<LabelSets | null> = this.labelsService.textBlockLabelSets;

  paragraphs = this.paragraphService.paragraphList as Observable<ParagraphWithTextAndClassifications[]>;
  hasParagraph: Observable<boolean> = this.paragraphService.hasParagraph;
  paragraphLoaded: Observable<boolean> = this.paragraphService.paragraphLoaded;

  previousQuery?: string;
  searchQuery = '';
  hasMoreResults = false;
  extendedResults = false;
  isAdminOrContrib = this.editResource.isAdminOrContrib;

  constructor(
    private route: ActivatedRoute,
    private editResource: EditResourceService,
    private paragraphService: ParagraphService,
    private labelsService: LabelsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.editResource.setCurrentView('classification');

    combineLatest([this.fieldId, this.resource])
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(([fieldId, resource]) => this.paragraphService.initParagraphs(fieldId, resource));
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
    this.paragraphService.cleanup();
  }

  triggerSearch() {
    // Reset pagination on new query
    if (this.previousQuery !== this.searchQuery) {
      this.previousQuery = this.searchQuery;
      this.extendedResults = false;
    }
    this._triggerSearch(this.searchQuery).subscribe((results) => {
      this.paragraphService.setSearchResults(results);
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
      this.paragraphService.setSearchResults(null);
      this.hasMoreResults = false;
      this.extendedResults = false;
      this.cdr.markForCheck();
    }
  }

  loadMore() {
    if (this.hasMoreResults && !this.extendedResults && this.searchQuery) {
      this._triggerSearch(this.searchQuery, true).subscribe((results) => {
        this.paragraphService.setSearchResults(results);
        this.updatePagination(results);
        this.extendedResults = true;
      });
    }
  }

  private updatePagination(results: Search.Results) {
    if (results.paragraphs) {
      this.hasMoreResults = results.paragraphs.results.length < results.paragraphs.total;
    }
  }

  private _triggerSearch(query: string, extendedResults = false) {
    return forkJoin([this.fieldId.pipe(take(1)), this.resource.pipe(take(1))]).pipe(
      switchMap(([field, resource]) =>
        this.paragraphService.searchInField(query, resource, field, extendedResults),
      ),
    );
  }
}
