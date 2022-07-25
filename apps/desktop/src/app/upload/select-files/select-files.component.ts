import {
  Component,
  AfterViewInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { concat, merge, fromEvent, Observable, Subject, of } from 'rxjs';
import {
  tap,
  filter,
  takeUntil,
  auditTime,
  scan,
  switchMap,
  concatMap,
  share,
  catchError,
  mapTo,
  map,
} from 'rxjs/operators';
import { SyncItem, ISourceConnector, SearchResults } from '../../sync/models';

@Component({
  selector: 'nde-select-files',
  templateUrl: './select-files.component.html',
  styleUrls: ['./select-files.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectFilesComponent implements AfterViewInit, OnDestroy {
  @Input() source: ISourceConnector | undefined;
  @Input() selection: SelectionModel<SyncItem>;
  @Output() selectionChange = new EventEmitter<SelectionModel<SyncItem>>();
  @Output() next = new EventEmitter<void>();
  @ViewChild('scroll') private scroll?: ElementRef;

  query = '';
  triggerSearch = new Subject<void>();
  triggerNextPage = new Subject<void>();
  unsubscribeAll = new Subject<void>();
  nextPage?: Observable<SearchResults>;
  loading = false;
  isSelectingAll = false;

  items: SyncItem[] = [];
  resources: Observable<SyncItem[]> = this.triggerSearch.pipe(
    filter(() => !!this.source),
    tap(() => {
      this.loading = true;
    }),
    switchMap(() =>
      concat(
        (this.source as ISourceConnector).getFiles(this.query).pipe(
          catchError((error) => {
            if (this.source && error.status === 403) {
              if (this.source.hasServerSideAuth) {
                this.source.goToOAuth();
              }
              return this.source.authenticate().pipe(mapTo({ items: [], nextPage: undefined }));
            } else {
              return of({ items: [], nextPage: undefined });
            }
          }),
        ),
        this.triggerNextPage.pipe(
          filter(() => !this.loading),
          tap(() => {
            this.loading = true;
          }),
          concatMap(() => (this.nextPage ? this.nextPage : of({ items: [], nextPage: undefined }))),
        ),
      ).pipe(
        tap((res) => {
          this.nextPage = res.nextPage;
          this.loading = false;
        }),
        scan((acc, current) => acc.concat(current.items), [] as SyncItem[]),
      ),
    ),
    share(),
  );

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.triggerSearch.next();
    }, 200);

    // TODO: can't use async pipe in the template because (unexpectedly) it doesn't work on GDrive connector.
    this.resources.pipe(takeUntil(this.unsubscribeAll)).subscribe((resources) => {
      this.items = resources;
      this.cdr.detectChanges();
    });

    // Infinite scroll
    const container = this.scroll?.nativeElement;
    if (container) {
      merge(fromEvent(container, 'scroll'), this.resources)
        .pipe(
          auditTime(300),
          filter(() => !!this.nextPage && !this.loading),
          filter(() => container.scrollTop > container.scrollHeight - container.clientHeight - 400),
          takeUntil(this.unsubscribeAll),
        )
        .subscribe(() => {
          this.triggerNextPage.next();
        });
    }
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  search(query: string) {
    this.query = query;
    this.triggerSearch.next();
  }

  toggle(resource: SyncItem) {
    this.selection.toggle(resource);
    this.selectionChange.emit(this.selection);
    this.cdr.detectChanges();
  }

  toggleSelectAll(selectAll: boolean) {
    this.isSelectingAll = selectAll;
    if (this.isSelectingAll) {
      this.loading = true;
      this.cdr?.markForCheck();
      this.getAllFiles().subscribe((items) => {
        this.selection = new SelectionModel(true, items);
        this.selectionChange.emit(this.selection);
        this.loading = false;
        this.cdr?.markForCheck();
      });
    } else {
      this.selection = new SelectionModel(true, []);
      this.selectionChange.emit(this.selection);
      this.cdr?.markForCheck();
    }
  }

  getAllFiles(): Observable<SyncItem[]> {
    return (this.source as ISourceConnector).getFiles().pipe(
      concatMap((res) => this._getAllFiles(res)),
      map((res) => res.items),
    );
  }

  private _getAllFiles(currentResults?: SearchResults): Observable<SearchResults> {
    return currentResults && currentResults.nextPage
      ? currentResults.nextPage.pipe(
          map((res) => ({ ...res, items: [...currentResults.items, ...res.items] })),
          concatMap((res) => this._getAllFiles(res)),
        )
      : of(currentResults || { items: [] });
  }
}
