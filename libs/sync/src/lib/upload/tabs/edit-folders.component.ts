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
import { SearchResults, SyncItem } from '../../sync/models';
import { SyncService } from '../../sync/sync.service';
import { SisToastService } from '@nuclia/sistema';

const SLASH_REG = /\//g;
@Component({
  selector: 'nsy-edit-folders',
  templateUrl: 'edit-folders.component.html',
  styleUrls: ['edit-folders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditSyncFoldersComponent implements OnInit, AfterViewInit {
  @Output() goTo = new EventEmitter<string>();
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
    switchMap(() =>
      this.syncService
        .getFolders(this.query)
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
    map((items) =>
      items
        .map((item) => {
          let path = item.metadata['path'];
          if (!path) {
            path = '/';
          } else {
            if (!path.startsWith('/')) {
              path = `/${path}`;
            }
            path += '/';
            path = path.replace(SLASH_REG, ' / ');
          }
          return {
            ...item,
            metadata: { ...(item.metadata || {}), path },
          };
        })
        .sort((a, b) => {
          const aFullPath = a.metadata['path'] === '/' ? ` / ${a.title}` : `${a.metadata['path']} / ${a.title}`;
          const bFullPath = b.metadata['path'] === '/' ? ` / ${b.title}` : `${b.metadata['path']} / ${b.title}`;
          return aFullPath.localeCompare(bFullPath);
        }),
    ),
    share(),
  );

  constructor(
    private syncService: SyncService,
    private toast: SisToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    forkJoin([this.syncService.getCurrentSync().pipe(take(1)), this.resources.pipe(take(1))]).subscribe(
      ([current, resources]) => {
        current.foldersToSync?.forEach((item) => {
          const match = resources.find((r) => r.uuid === item.uuid);
          if (match) {
            this.selection.select(match);
          }
        });
        this.cdr.detectChanges();
      },
    );
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.triggerSearch.next();
    }, 200);
  }
  save() {
    this.syncService.currentSourceId
      .pipe(
        take(1),
        switchMap((id) => this.syncService.updateSync(id || '', { foldersToSync: this.selection.selected }, true)),
      )
      .subscribe({
        next: () => {
          this.toast.success('upload.saved');
          this.goTo.emit('activity');
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
