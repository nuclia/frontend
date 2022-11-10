import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { markForCheck } from '@guillotinaweb/pastanaga-angular';
import { SDKService, StateService, STFTrackingService } from '@flaps/core';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { TrainingStatus, TrainingTask, TrainingType } from '@nuclia/core';
import { forkJoin, shareReplay, Subject, take, tap } from 'rxjs';

@Component({
  selector: 'app-knowledge-box-processes',
  templateUrl: './knowledge-box-processes.component.html',
  styleUrls: ['./knowledge-box-processes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KnowledgeBoxProcessesComponent implements OnInit, OnDestroy {
  private unsubscribeAll: Subject<void> = new Subject();

  agreement = { [TrainingType.classifier]: false, [TrainingType.labeler]: false };
  running = { [TrainingType.classifier]: false, [TrainingType.labeler]: false };
  selectedLabelsets = { [TrainingType.classifier]: [] as string[], [TrainingType.labeler]: [] as string[] };
  open = { [TrainingType.classifier]: false, [TrainingType.labeler]: false };
  lastRun = { [TrainingType.classifier]: '', [TrainingType.labeler]: '' };
  hoursRequired = 10;
  cannotTrain = this.stateService.account.pipe(map((account) => account && account.type === 'stash-basic'));
  trainingTypes = TrainingType;
  labelsets = this.sdk.currentKb.pipe(
    switchMap((kb) => kb.getLabels()),
    map((labelsets) => Object.entries(labelsets).map(([id, labelset]) => ({ value: id, title: labelset.title }))),
    shareReplay(),
  );
  isBillingEnabled = this.tracking.isFeatureEnabled('billing').pipe(shareReplay(1));

  constructor(
    private sdk: SDKService,
    private stateService: StateService,
    private cdr: ChangeDetectorRef,
    private tracking: STFTrackingService,
  ) {}

  ngOnInit() {
    this.sdk.currentKb
      .pipe(
        switchMap((kb) =>
          forkJoin([kb.training.getStatus(TrainingType.classifier), kb.training.getStatus(TrainingType.labeler)]),
        ),
        tap(([classifierStatus, labelerStatus]: TrainingTask[]) => {
          this.lastRun[TrainingType.classifier] = classifierStatus.last_execution?.end || '';
          this.lastRun[TrainingType.labeler] = labelerStatus.last_execution?.end || '';
        }),
        map((statuses) => statuses.map((status) => status.status === TrainingStatus.running)),
      )
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((statuses) => {
        this.running[TrainingType.classifier] = statuses[0];
        this.running[TrainingType.labeler] = statuses[1];
        markForCheck(this.cdr);
      });
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  toggleLabelset(type: TrainingType, labelset: string) {
    if (this.selectedLabelsets[type].includes(labelset)) {
      this.selectedLabelsets[type] = this.selectedLabelsets[type].filter((item) => item !== labelset);
    } else {
      this.selectedLabelsets[type] = [...this.selectedLabelsets[type], labelset];
    }
    markForCheck(this.cdr);
  }

  toggleAll(type: TrainingType) {
    this.labelsets.pipe(take(1)).subscribe((labelsets) => {
      const selectAll = this.selectedLabelsets[type].length < labelsets.length;
      this.selectedLabelsets[type] = selectAll ? labelsets.map((item) => item.value) : [];
      markForCheck(this.cdr);
    });
  }

  startOrStopTraining(type: TrainingType) {
    this.sdk.currentKb
      .pipe(
        switchMap((kb) =>
          this.running[type]
            ? kb.training.stop(type)
            : kb.training.start(
                type,
                this.selectedLabelsets[type].length > 0 ? this.selectedLabelsets[type] : undefined,
              ),
        ),
      )
      .subscribe(() => {
        this.running[type] = !this.running[type];
        markForCheck(this.cdr);
      });
  }
}
