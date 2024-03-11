import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';
import { catchError, forkJoin, map, Observable, of, scan, share, Subject, switchMap, take, tap } from 'rxjs';
import { SelectionModel } from '@angular/cdk/collections';
import { SearchResults, Source, SyncItem } from '../../sync/new-models';
import { SyncService } from '../../sync/sync.service';
import { SisToastService } from '@nuclia/sistema';

@Component({
  selector: 'nsy-edit-folders',
  templateUrl: 'edit-folders.component.html',
  styleUrls: ['edit-folders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditSyncFoldersComponent implements OnInit, AfterViewInit {
  @Output() done = new EventEmitter();
  currentSource = this.syncService.currentSource;
  loading = false;
  query = '';
  selection = new SelectionModel<SyncItem>(true, []);
  triggerSearch = new Subject<void>();
  nextPage?: Observable<SearchResults>;
  canSelectFiles = this.syncService.currentSourceId.pipe(
    map((sourceId) => this.syncService.canSelectFiles(sourceId || '')),
  );
  resources: Observable<SyncItem[]> = this.triggerSearch.pipe(
    tap(() => {
      this.loading = true;
      this.cdr.markForCheck();
    }),
    switchMap(() => this.currentSource.pipe(take(1))),
    switchMap((source) =>
      (source.permanentSync ? this.syncService.getFolders(this.query) : this.syncService.getFiles(this.query))
        .pipe(
          catchError((error) => {
            if (error) {
              this.toast.error(
                typeof error === 'string'
                  ? error
                  : error.error?.message || error.error || error.message || 'An error occurred',
              );
            }

            return of({ items: [], nextPage: undefined });
          }),
        )
        .pipe(
          tap(() => {
            this.loading = false;
            this.cdr.markForCheck();
          }),
          scan((acc, current) => acc.concat(current.items), [] as SyncItem[]),
        ),
    ),
    share(),
  );

  constructor(
    private syncService: SyncService,
    private toast: SisToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    forkJoin([this.currentSource.pipe(take(1)), this.resources.pipe(take(1))]).subscribe(([current, resources]) => {
      current.items?.forEach((item) => {
        const match = resources.find((r) => r.uuid === item.uuid);
        if (match) {
          this.selection.select(match);
        }
      });
      this.cdr.detectChanges();
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.triggerSearch.next();
    }, 200);
  }
  save() {
    this.currentSource
      .pipe(
        take(1),
        switchMap(() => this.syncService.currentSourceId.pipe(take(1))),
        switchMap((id) => this.syncService.setSourceData(id || '', { items: this.selection.selected } as Source, true)),
      )
      .subscribe({
        next: () => {
          this.toast.success('upload.saved');
          this.done.emit();
        },
        error: () => {
          this.toast.error('upload.failed');
        },
      });
  }

  toggle(resource: SyncItem) {
    this.selection.toggle(resource);
    this.cdr.detectChanges();
  }
}
