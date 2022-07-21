import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { SDKService, StateService } from '@flaps/core';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { TrainingStatus, TrainingType } from '@nuclia/core';
import { forkJoin, Subject } from 'rxjs';

@Component({
  selector: 'app-knowledge-box-processes',
  templateUrl: './knowledge-box-processes.component.html',
  styleUrls: ['./knowledge-box-processes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KnowledgeBoxProcessesComponent implements OnInit, OnDestroy {
  agreement = { [TrainingType.classifier]: false, [TrainingType.labeller]: false };
  running = { [TrainingType.classifier]: false, [TrainingType.labeller]: false };
  selectedLabelsets = { [TrainingType.classifier]: '', [TrainingType.labeller]: '' };
  lastRun = '20-04-21';
  hoursRequired = 10;
  cannotTrain = this.stateService.account.pipe(map((account) => account && account.type === 'stash-basic'));
  private unsubscribeAll: Subject<void> = new Subject();
  trainingTypes = TrainingType;
  labelsets = this.sdk.currentKb.pipe(
    switchMap((kb) => kb.getLabels()),
    map((labelsets) => Object.entries(labelsets).map(([id, labelset]) => ({ value: id, title: labelset.title }))),
  );

  constructor(private sdk: SDKService, private stateService: StateService, private cdr: ChangeDetectorRef) {}

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

  startOrStopTraining(type: TrainingType) {
    this.sdk.currentKb
      .pipe(
        switchMap((kb) =>
          this.running[type]
            ? kb.training.stop(type)
            : kb.training.start(type, this.selectedLabelsets[type] ? [this.selectedLabelsets[type]] : undefined),
        ),
      )
      .subscribe(() => {
        this.running[type] = !this.running[type];
        this.cdr?.markForCheck();
      });
  }
}
