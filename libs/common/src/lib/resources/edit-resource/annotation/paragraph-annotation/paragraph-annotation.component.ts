import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, forkJoin, map, Observable, switchMap, take } from 'rxjs';
import { Search } from '@nuclia/core';
import { EntityGroup, ParagraphWithTextAndAnnotations } from '../../edit-resource.helpers';
import { takeUntil } from 'rxjs/operators';
import { ParagraphAnnotationService } from './paragraph-annotation.service';
import { SelectFirstFieldDirective } from '../../select-first-field/select-first-field.directive';

@Component({
  templateUrl: './paragraph-annotation.component.html',
  styleUrls: ['../../common-page-layout.scss', './paragraph-annotation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParagraphAnnotationComponent extends SelectFirstFieldDirective implements OnInit, OnDestroy {
  paragraphs: Observable<ParagraphWithTextAndAnnotations[]> = this.annotationService.paragraphs;
  hasParagraph: Observable<boolean> = this.annotationService.hasParagraph;
  paragraphLoaded: Observable<boolean> = this.annotationService.paragraphLoaded;

  entityFamilies: Observable<EntityGroup[]> = this.editResource
    .loadResourceEntities()
    .pipe(map((families) => families.filter((family) => family.entities.length > 0)));
  selectedFamily: Observable<EntityGroup | null> = this.annotationService.selectedFamily;

  previousQuery?: string;
  searchQuery = '';
  hasMoreResults = false;
  nextPageNumber = 0;

  constructor(
    private annotationService: ParagraphAnnotationService,
    private cdr: ChangeDetectorRef,
  ) {
    super();
  }

  ngOnInit(): void {
    this.editResource.setCurrentView('annotation');

    combineLatest([this.fieldId, this.resource, this.entityFamilies])
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(([fieldId, resource, families]) => this.annotationService.initParagraphs(fieldId, resource, families));
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this.annotationService.cleanup();
  }

  triggerSearch() {
    // Reset pagination on new query
    if (this.previousQuery !== this.searchQuery) {
      this.previousQuery = this.searchQuery;
      this.nextPageNumber = 0;
    }
    this._triggerSearch(this.searchQuery).subscribe((results) => {
      this.annotationService.setSearchResults(results);
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
      this.annotationService.setSearchResults(null);
      this.hasMoreResults = false;
      this.nextPageNumber = 0;
      this.cdr.markForCheck();
    }
  }

  loadMore() {
    if (this.hasMoreResults && this.searchQuery) {
      this._triggerSearch(this.searchQuery).subscribe((results) => {
        this.annotationService.appendSearchResults(results);
        this.updatePagination(results);
      });
    }
  }

  selectFamily(family: EntityGroup) {
    this.annotationService.selectFamily(family);
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
        this.annotationService.searchInField(query, resource, field, this.nextPageNumber),
      ),
    );
  }
}
