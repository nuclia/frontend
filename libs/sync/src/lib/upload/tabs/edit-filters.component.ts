import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { switchMap, take } from 'rxjs';
import { SyncService } from '../../logic/sync.service';
import { SisToastService } from '@nuclia/sistema';
import { Filters } from '../../logic/models';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'nsy-edit-filters',
  templateUrl: 'edit-filters.component.html',
  styleUrls: ['edit-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditSyncFiltersComponent implements OnInit {
  @Output() goTo = new EventEmitter<string>();
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
    this.syncService
      .getCurrentSync()
      .pipe(take(1))
      .subscribe((sync) => {
        this.filtersForm.setValue({
          fileExtensions: sync.filters?.fileExtensions?.extensions || '',
          exclude: sync.filters?.fileExtensions?.exclude || false,
          fromDate: sync.filters?.modified?.from || '',
          toDate: sync.filters?.modified?.to || '',
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
    this.syncService.currentSyncId
      .pipe(
        take(1),
        switchMap((id) => this.syncService.updateSync(id || '', { filters }, true)),
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
}
