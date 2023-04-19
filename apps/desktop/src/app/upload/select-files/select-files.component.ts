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
import { tap, filter, takeUntil, auditTime, scan, switchMap, concatMap, share, catchError, map } from 'rxjs/operators';
import { SyncItem, ISourceConnector, SearchResults, CONNECTOR_ID_KEY } from '../../sync/models';
import { defaultAuthCheck } from '../../utils';
import { SisToastService } from '@nuclia/sistema';
import { SyncService } from '../../sync/sync.service';

@Component({
  selector: 'nde-select-files',
  templateUrl: './select-files.component.html',
  styleUrls: ['./select-files.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectFilesComponent implements AfterViewInit, OnDestroy {
  @Input() source: ISourceConnector | undefined;
  @Input() sourceId?: string;
  @Input() selection: SelectionModel<SyncItem>;
  @Output() selectionChange = new EventEmitter<SelectionModel<SyncItem>>();
  @Output() next = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @ViewChild('scroll') private scroll?: ElementRef;

  query = '';
  triggerSearch = new Subject<void>();
  triggerNextPage = new Subject<void>();
  unsubscribeAll = new Subject<void>();
  nextPage?: Observable<SearchResults>;
  loading = false;
  isSelectingAll = false;
  currentSource = this.sync.currentSource;

  resources: Observable<SyncItem[]> = this.triggerSearch.pipe(
    filter(() => !!this.source),
    tap(() => {
      this.loading = true;
    }),
    switchMap(() => this.currentSource),
    switchMap((source) =>
      (source.permanentSync ? this.sync.getFolders(this.query) : this.sync.getFiles(this.query))
        .pipe(
          catchError((error) => {
            this.toaster.error(
              typeof error === 'string' ? error : error?.error?.message || error?.message || 'An error occurred',
            );
            return of({ items: [], nextPage: undefined });
          }),
        )
        .pipe(
          tap(() => {
            this.loading = false;
          }),
          scan((acc, current) => acc.concat(current.items), [] as SyncItem[]),
        ),
    ),
    share(),
  );

  constructor(private cdr: ChangeDetectorRef, private toaster: SisToastService, private sync: SyncService) {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.triggerSearch.next();
    }, 200);
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
    return this.sync.getFiles().pipe(map((res) => res.items));
  }
}
