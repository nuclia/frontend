import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { switchMap, take } from 'rxjs';
import { SyncService } from '../../sync/sync.service';
import { SisToastService } from '@nuclia/sistema';
import { Filters, Source } from '../../sync/new-models';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'nsy-edit-filters',
  templateUrl: 'edit-filters.component.html',
  styleUrls: ['edit-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditSyncFiltersComponent implements OnInit {
  @Output() done = new EventEmitter();
  currentSource = this.syncService.currentSource;
  filtersForm = new FormGroup({
    fileExtensions: new FormControl<string>(''),
    exclude: new FormControl<boolean>(false),
    fromDate: new FormControl<string>(''),
    toDate: new FormControl<string>(''),
  });

  constructor(
    private syncService: SyncService,
    private toast: SisToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.currentSource.pipe(take(1)).subscribe((source) => {
      console.log(source);
      this.filtersForm.setValue({
        fileExtensions: source.filters?.fileExtensions?.extensions || '',
        exclude: source.filters?.fileExtensions?.exclude || false,
        fromDate: source.filters?.modified?.from || '',
        toDate: source.filters?.modified?.to || '',
      });
      this.cdr.markForCheck();
    });
  }

  save() {
    const filters: Filters = {};
    if (this.filtersForm.value.fileExtensions) {
      filters.fileExtensions = {
        extensions: this.filtersForm.value.fileExtensions,
        exclude: !!this.filtersForm.value.exclude,
      };
    }
    if (this.filtersForm.value.fromDate || this.filtersForm.value.toDate) {
      filters.modified = {
        from: this.filtersForm.value.fromDate || undefined,
        to: this.filtersForm.value.toDate || undefined,
      };
    }
    this.syncService.currentSourceId
      .pipe(
        take(1),
        switchMap((id) => this.syncService.setSourceData(id || '', { filters } as Source, true)),
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
}
