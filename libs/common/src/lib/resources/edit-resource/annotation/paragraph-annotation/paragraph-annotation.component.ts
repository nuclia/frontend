import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { combineLatest, filter, forkJoin, Observable, switchMap, take, tap } from 'rxjs';
import { Search } from '@nuclia/core';
import { EntityGroup, ParagraphWithTextAndAnnotations } from '../../edit-resource.helpers';
import { takeUntil } from 'rxjs/operators';
import { SisToastService } from '@nuclia/sistema';
import { EntityAnnotationWithPid, ParagraphAnnotationService } from './paragraph-annotation.service';
import { SelectFirstFieldDirective } from '../../select-first-field/select-first-field.directive';

@Component({
  templateUrl: './paragraph-annotation.component.html',
  styleUrls: ['../../common-page-layout.scss', './paragraph-annotation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParagraphAnnotationComponent extends SelectFirstFieldDirective implements OnInit, OnDestroy {
  @ViewChild('paragraphsContainer') paragraphsContainer?: ElementRef<HTMLElement>;

  isModified = false;
  isSaving = false;

  paragraphs: Observable<ParagraphWithTextAndAnnotations[]> = this.annotationService.paragraphs.pipe(
    tap(() =>
      setTimeout(() => {
        this.cleanUpMarkListener();
        this.setupMarkListener();
      }),
    ),
  );
  hasParagraph: Observable<boolean> = this.annotationService.hasParagraph;
  paragraphLoaded: Observable<boolean> = this.annotationService.paragraphLoaded;
  isAdminOrContrib = this.editResource.isAdminOrContrib;
  customNerEnabled = this.editResource.customNerEnabled;

  entityFamilies: Observable<EntityGroup[]> = this.editResource.loadResourceEntities();
  selectedFamily: Observable<EntityGroup | null> = this.annotationService.selectedFamily;
  selectedEntity?: EntityAnnotationWithPid;
  userSelection?: EntityAnnotationWithPid;
  buttonPosition?: { top: string; left: string };

  previousQuery?: string;
  searchQuery = '';
  hasMoreResults = false;
  nextPageNumber = 0;

  constructor(
    private annotationService: ParagraphAnnotationService,
    private toaster: SisToastService,
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
    this.cleanUpMarkListener();
  }

  save() {
    this.isSaving = true;
    this.selectedEntity = undefined;
    this.annotationService.resetFamily();
    forkJoin([this.fieldId.pipe(take(1)), this.paragraphs.pipe(take(1))])
      .pipe(switchMap(([field, paragraphs]) => this.editResource.saveAnnotations(field, paragraphs)))
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
    this.annotationService.resetParagraphs();
    this.isModified = false;
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

  removeEntityFromParagraph(paragraph: ParagraphWithTextAndAnnotations) {
    if (!this.selectedEntity || !this.annotationService.selectedFamilyValue) {
      return;
    }
    this.annotationService.removeEntityFromParagraph(paragraph, this.selectedEntity);
    // Unselect the deleted entity
    this.selectedEntity = undefined;
    this.isModified = this.annotationService.hasModifications();
  }

  addEntity(paragraph: ParagraphWithTextAndAnnotations) {
    if (!this.userSelection) {
      return;
    }
    this.annotationService.addEntity(paragraph, this.userSelection);
    this.isModified = this.annotationService.hasModifications();
    this.cleanupSelection();
  }

  updateEntity(paragraph: ParagraphWithTextAndAnnotations) {
    if (!this.selectedEntity || !this.annotationService.selectedFamilyValue) {
      return;
    }
    this.annotationService.updateEntity(paragraph, this.selectedEntity);
    this.isModified = this.annotationService.hasModifications();
  }

  /**
   * On mouse up on a paragraph, we check if there is a text selection:
   * - if so, we set up the entity annotation corresponding to user selection, and we position the button accordingly
   * - if not, we clean up previous selection if any
   * @param $event
   */
  onMouseUp($event: MouseEvent) {
    this.customNerEnabled
      .pipe(
        take(1),
        filter((enabled) => enabled),
      )
      .subscribe(() => {
        const paragraph = $event.target as HTMLElement;
        const family = this.annotationService.selectedFamilyValue;
        const selection = window.getSelection();
        if (paragraph && family && selection && !selection.isCollapsed) {
          const paragraphRect = paragraph.getBoundingClientRect();
          this.buttonPosition = {
            top: `${$event.clientY - paragraphRect.bottom + 8}px`,
            left: `${$event.clientX - paragraphRect.left}px`,
          };

          const paragraphText = paragraph.textContent as string;
          const selectionText = selection.toString();
          const range = selection.getRangeAt(0);
          let start = range.startOffset;
          let end = range.endOffset;
          if (selectionText !== paragraphText.slice(start, end)) {
            const exactPosition = this.getExactPositionOfSelection(selectionText, range);
            if (exactPosition) {
              start = exactPosition.start;
              end = exactPosition.end;
            }
          }
          const paragraphId = paragraph.getAttribute('paragraphId') as string;
          this.userSelection = {
            paragraphId,
            start,
            end,
            klass: family.id,
            token: selectionText.replace(/\s+/gi, ' ').trim(),
            family: family.title,
          };
        } else {
          this.cleanupSelection();
        }
      });
  }

  /**
   * Returns the position of the selection in the paragraph
   * @param paragraphText
   * @param selectionText
   * @param range
   * @private
   */
  private getExactPositionOfSelection(selectionText: string, range: Range): { start: number; end: number } | null {
    // when double-clicking on a word on firefox, we can end up with selection like `\t Sinbad`
    // we trim the selection but need to know how many characters were trimmed, so we can then have the right positions
    let shiftBy = 0;
    // shift by the count of blanks at the beginning of the selection
    const startWithBlank = selectionText.match(/^\s+/);
    if (startWithBlank) {
      shiftBy = startWithBlank[0].length;
    }
    const endWithBlanks = selectionText.match(/\s+$/);
    if (endWithBlanks) {
      shiftBy += endWithBlanks[0].length;
    }

    let start: number;
    const previousMark = range.startContainer.previousSibling;
    if (previousMark && previousMark.ELEMENT_NODE) {
      const previousEnd = (previousMark as HTMLElement).getAttribute('end') || '';
      start = parseInt(previousEnd, 10) + range.startOffset + shiftBy;
    } else {
      start = range.startOffset + shiftBy;
    }

    return {
      start,
      end: start + (range.endOffset - range.startOffset - shiftBy),
    };
  }

  private cleanupSelection() {
    this.userSelection = undefined;
    this.buttonPosition = undefined;
    this.selectedEntity = undefined;
  }

  private setupMarkListener() {
    this.customNerEnabled
      .pipe(
        take(1),
        filter((enabled) => enabled),
      )
      .subscribe(() => {
        if (this.paragraphsContainer) {
          this.paragraphsContainer.nativeElement
            .querySelectorAll('mark[family]')
            .forEach((mark) => mark.addEventListener('click', this.clickOnAnnotation.bind(this)));
        }
      });
  }

  private cleanUpMarkListener() {
    if (this.paragraphsContainer) {
      this.paragraphsContainer.nativeElement
        .querySelectorAll('mark[family]')
        .forEach((mark) => mark.removeEventListener('click', this.clickOnAnnotation.bind(this)));
    }
  }

  private clickOnAnnotation(event: Event) {
    if (!this.annotationService.selectedFamilyValue) {
      this.toaster.info('resource.field-annotation.select-family-before');
      return;
    }
    const mark = event.target as HTMLElement;
    const paragraph = mark.parentElement as HTMLElement;
    this.selectedEntity = {
      paragraphId: paragraph.getAttribute('paragraphId') || '',
      family: mark.getAttribute('title') || '',
      token: mark.getAttribute('token') || '',
      start: parseInt(mark.getAttribute('start') || '0', 10),
      end: parseInt(mark.getAttribute('end') || '0', 10),
      klass: mark.getAttribute('family') || '',
      immutable: mark.getAttribute('immutable') === 'true',
    };
    const paragraphRect = paragraph.getBoundingClientRect();
    const markRect = mark.getBoundingClientRect();
    const buttonBlockWidth =
      !this.userSelection && this.selectedEntity.klass !== this.annotationService.selectedFamilyValue?.id ? 32 : 16;
    this.buttonPosition = {
      left: markRect.height < 16 ? `${markRect.right - paragraphRect.left - buttonBlockWidth}px` : '0',
      top: `${markRect.bottom - paragraphRect.bottom}px`,
    };
    this.cdr.markForCheck();
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

  @HostListener('window:keyup.enter', ['$event'])
  @HostListener('window:keyup.escape', ['$event'])
  @HostListener('window:keyup.delete', ['$event'])
  private onKeyUp(event: KeyboardEvent) {
    if (document.activeElement !== document.body) return;
    forkJoin([this.paragraphs.pipe(take(1)), this.isAdminOrContrib.pipe(take(1))]).subscribe(
      ([paragraphs, isAdminOrContrib]) => {
        if (!isAdminOrContrib || !this.annotationService.selectedFamilyValue) return;
        if (this.selectedEntity) {
          const paragraph = paragraphs.find((paragraph) => paragraph.paragraphId === this.selectedEntity?.paragraphId);
          if (paragraph) {
            if (event.key === 'Enter') {
              this.updateEntity(paragraph);
            } else if (event.key === 'Delete') {
              this.removeEntityFromParagraph(paragraph);
            } else if (event.key === 'Escape') {
              this.cleanupSelection();
            }
          }
        } else if (this.userSelection) {
          const paragraph = paragraphs.find((paragraph) => paragraph.paragraphId === this.userSelection?.paragraphId);
          if (paragraph) {
            if (event.key === 'Enter') {
              this.addEntity(paragraph);
            } else if (event.key === 'Escape') {
              this.cleanupSelection();
              window.getSelection()?.empty();
            }
          }
        }
      },
    );
  }
}
