import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import {PostHogService, SDKService, StateService} from '@flaps/core';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { TrainingStatus, TrainingType } from '@nuclia/core';
import { forkJoin, shareReplay, Subject, take } from 'rxjs';

@Component({
  selector: 'app-knowledge-box-processes',
  templateUrl: './knowledge-box-processes.component.html',
  styleUrls: ['./knowledge-box-processes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KnowledgeBoxProcessesComponent implements OnInit, OnDestroy {
  private unsubscribeAll: Subject<void> = new Subject();

  agreement = { [TrainingType.classifier]: false, [TrainingType.labeller]: false };
  running = { [TrainingType.classifier]: false, [TrainingType.labeller]: false };
  selectedLabelsets = { [TrainingType.classifier]: [] as string[], [TrainingType.labeller]: [] as string[] };
  open = { [TrainingType.classifier]: false, [TrainingType.labeller]: false };
  lastRun = '20-04-21';
  hoursRequired = 10;
  cannotTrain = this.stateService.account.pipe(map((account) => account && account.type === 'stash-basic'));
  trainingTypes = TrainingType;
  labelsets = this.sdk.currentKb.pipe(
    switchMap((kb) => kb.getLabels()),
    map((labelsets) => Object.entries(labelsets).map(([id, labelset]) => ({ value: id, title: labelset.title }))),
    shareReplay(),
  );
  isBillingEnabled = this.postHogService.isFeatureEnabled('billing').pipe(shareReplay(1));

  constructor(private sdk: SDKService, private stateService: StateService, private cdr: ChangeDetectorRef, private postHogService: PostHogService) {}

  ngOnInit() {
    this.sdk.currentKb
      .pipe(
        switchMap((kb) =>
          forkJoin([kb.training.getStatus(TrainingType.classifier), kb.training.getStatus(TrainingType.labeller)]),
        ),
        map((statuses) => statuses.map((status) => status.status === TrainingStatus.running)),
      )
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((statuses) => {
        this.running[TrainingType.classifier] = statuses[0];
        this.running[TrainingType.labeller] = statuses[1];
        this.cdr?.markForCheck();
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
    this.cdr?.markForCheck();
  }

  toggleAll(type: TrainingType) {
    this.labelsets.pipe(take(1)).subscribe((labelsets) => {
      const selectAll = this.selectedLabelsets[type].length < labelsets.length;
      this.selectedLabelsets[type] = selectAll ? labelsets.map((item) => item.value) : [];
      this.cdr?.markForCheck();
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
        this.cdr?.markForCheck();
      });
  }
}
