import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SelectionModel } from '@angular/cdk/collections';
import { combineLatest, Observable, of, Subject, take } from 'rxjs';
import { catchError, filter, map, scan, share, switchMap, tap } from 'rxjs/operators';
import { FileStatus, SearchResults, SyncItem } from '../../sync/models';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { TranslateService } from '@ngx-translate/core';
import { SyncService } from '../../sync/sync.service';

@Component({
  selector: 'nsy-select-files',
  templateUrl: './select-files.component.html',
  styleUrls: ['./select-files.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectFilesComponent implements AfterViewInit {
  @Output() settings = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @ViewChild('scroll') private scroll?: ElementRef;

  selection = new SelectionModel<SyncItem>(true, []);
  query = '';
  triggerSearch = new Subject<void>();
  triggerNextPage = new Subject<void>();
  nextPage?: Observable<SearchResults>;
  loading = false;
  isSelectingAll = false;
  currentSource = this.sync.currentSource;
  canSelectFiles = this.sync.currentSourceId.pipe(map((sourceId) => this.sync.canSelectFiles(sourceId || '')));

  resources: Observable<SyncItem[]> = this.triggerSearch.pipe(
    tap(() => {
      this.loading = true;
    }),
    switchMap(() => this.currentSource.pipe(take(1))),
    switchMap((source) =>
      (source.permanentSync ? this.sync.getFolders(this.query) : this.sync.getFiles(this.query))
        .pipe(
          catchError((error) => {
            this.toaster.error(
              typeof error === 'string'
                ? error
                : error?.error?.message || error?.error || error?.message || 'An error occurred',
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

  currentSourceId = this.sync.currentSourceId;
  currentConnector = combineLatest([this.sync.currentSource, this.sync.sourceObs]).pipe(
    map(([source, definitions]) => definitions.find((definition) => definition.id === source?.connectorId)),
  );
  nucliaCloud = this.sync.destinations['nucliacloud'].definition;

  constructor(
    private cdr: ChangeDetectorRef,
    private toaster: SisToastService,
    private sync: SyncService,
    private modalService: SisModalService,
    private translate: TranslateService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.triggerSearch.next();
    }, 200);
  }

  search(query: string) {
    this.query = query;
    this.triggerSearch.next();
  }

  toggle(resource: SyncItem) {
    this.selection.toggle(resource);
    this.cdr.detectChanges();
  }

  toggleSelectAll(selectAll: boolean) {
    this.isSelectingAll = selectAll;
    if (this.isSelectingAll) {
      this.loading = true;
      this.cdr?.markForCheck();
      this.getAllFiles().subscribe((items) => {
        this.selection = new SelectionModel(true, items);
        this.loading = false;
        this.cdr?.markForCheck();
      });
    } else {
      this.selection = new SelectionModel<SyncItem>(true, []);
      this.cdr?.markForCheck();
    }
  }

  getAllFiles(): Observable<SyncItem[]> {
    return this.sync.getFiles().pipe(map((res) => res.items));
  }

  goToSettings() {
    this.settings.emit();
  }

  upload() {
    this.sync.currentSource.pipe(take(1)).subscribe((source) => {
      if (source.connectorId === 'folder' && source.permanentSync) {
        const data = source.data;
        if (data) {
          this.selection.setSelection({
            uuid: '',
            title: data['path'],
            originalId: data['path'],
            metadata: {},
            status: FileStatus.PENDING,
          });
        }
      } else if (source.connectorId === 'sitemap') {
        // Add empty item just to trigger sitemap synchronization
        this.selection.setSelection({
          uuid: '',
          title: '',
          originalId: '',
          metadata: {},
          status: FileStatus.PENDING,
        });
      }
      this.sync.addSync(this.sync.getCurrentSourceId() || '', this.selection.selected).subscribe((success) => {
        if (success) {
          this.router.navigate(['../history'], { relativeTo: this.route, queryParams: { active: 'true' } });
        }
      });
    });
  }

  delete() {
    const sourceId = this.sync.getCurrentSourceId();
    this.modalService
      .openConfirm({
        title: this.translate.instant('upload.source.confirm-delete-title', { name: sourceId }),
        description: 'upload.source.confirm-delete-description',
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this.sync.deleteSource(sourceId || '')),
      )
      .subscribe(() => {
        this.cancel.emit();
      });
  }
}
