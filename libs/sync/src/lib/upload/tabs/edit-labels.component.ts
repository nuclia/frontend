import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { map, switchMap, take } from 'rxjs';
import { SyncService } from '../../sync/sync.service';
import { SisToastService, getSelectionKey } from '@nuclia/sistema';
import { Classification, LabelSetKind, LabelSets } from '@nuclia/core';
import { SDKService } from '@flaps/core';
import { getClassificationFromSelection } from '@nuclia/sistema';

@Component({
  selector: 'nsy-edit-labels',
  templateUrl: 'edit-labels.component.html',
  styleUrls: ['edit-labels.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditSyncLabelsComponent implements OnInit {
  @Output() goTo = new EventEmitter<string>();
  labelSets = this.sdk.currentKb.pipe(
    take(1),
    switchMap((kb) => kb.getLabels()),
    map((labelSets) =>
      Object.entries(labelSets)
        .filter(([, value]) => value.kind.length === 0 || value.kind.includes(LabelSetKind.RESOURCES))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as LabelSets),
    ),
  );
  hasLabelSets = this.labelSets.pipe(map((labelSets) => Object.keys(labelSets || {}).length > 0));
  currentSelection: { [id: string]: boolean } = {};
  selectedLabels: Classification[] = [];

  constructor(
    private syncService: SyncService,
    private sdk: SDKService,
    private toast: SisToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.syncService
      .getCurrentSync()
      .pipe(take(1))
      .subscribe((sync) =>
        this.updateLabelSelection(
          (sync.labels || []).reduce(
            (all, label) => {
              return { ...all, [getSelectionKey(label.labelset, label.label)]: true };
            },
            {} as { [id: string]: boolean },
          ),
        ),
      );
  }

  save() {
    this.syncService.currentSourceId
      .pipe(
        take(1),
        switchMap((id) => this.syncService.updateSync(id || '', { labels: this.selectedLabels })),
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

  updateLabelSelection(selection: { [id: string]: boolean }) {
    this.currentSelection = selection;
    this.selectedLabels = getClassificationFromSelection(selection);
    this.cdr.detectChanges();
  }
}
