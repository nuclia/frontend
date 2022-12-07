import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { markForCheck } from '@guillotinaweb/pastanaga-angular';
import { SDKService, StateService, STFTrackingService } from '@flaps/core';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { TrainingStatus, TrainingType } from '@nuclia/core';
import { forkJoin, shareReplay, Subject, take, tap } from 'rxjs';

interface TrainingState {
  agreement: boolean;
  running: boolean;
  selectedOptions: string[];
  open: boolean;
  lastRun: string;
}

@Component({
  selector: 'app-knowledge-box-processes',
  templateUrl: './knowledge-box-processes.component.html',
  styleUrls: ['./knowledge-box-processes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KnowledgeBoxProcessesComponent implements OnInit, OnDestroy {
  private unsubscribeAll: Subject<void> = new Subject();

  cannotTrain = this.stateService.account.pipe(map((account) => account && account.type === 'stash-basic'));
  trainingTypes = TrainingType;
  labelsets = this.sdk.currentKb.pipe(
    switchMap((kb) => kb.getLabels()),
    map((labelsets) => Object.entries(labelsets).map(([id, labelset]) => ({ value: id, title: labelset.title }))),
    shareReplay(),
  );
  entitiesGroups = this.sdk.currentKb.pipe(
    switchMap((kb) => kb.getEntities()),
    map((entities) =>
      Object.entries(entities)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([id, entity]) => ({
          value: id,
          title: entity.title || 'resource.entities.' + id.toLowerCase(),
        })),
    ),
    shareReplay(),
  );
  trainingList = [TrainingType.classifier, TrainingType.labeler, TrainingType.ner];
  trainings = this.trainingList.reduce((acc, trainingType) => {
    acc[trainingType] = {
      agreement: false,
      running: false,
      selectedOptions: [],
      open: false,
      lastRun: '',
    };
    return acc;
  }, {} as { [key in TrainingType]: TrainingState });
  hoursRequired = 10;
  options = {
    [TrainingType.classifier]: this.labelsets,
    [TrainingType.labeler]: this.labelsets,
    [TrainingType.ner]: this.entitiesGroups,
  };
  isBillingEnabled = this.tracking.isFeatureEnabled('billing').pipe(shareReplay(1));
  enabledTrainings = this.tracking
    .isFeatureEnabled('training_ner')
    .pipe(map((enabled) => (enabled ? this.trainingList : this.trainingList.filter((t) => t !== TrainingType.ner))));

  constructor(
    private sdk: SDKService,
    private stateService: StateService,
    private cdr: ChangeDetectorRef,
    private tracking: STFTrackingService,
  ) {}

  ngOnInit() {
    this.sdk.currentKb
      .pipe(
        switchMap((kb) => forkJoin(this.trainingList.map((trainingType) => kb.training.getStatus(trainingType)))),
        tap((statuses) => {
          statuses.forEach((status, i) => {
            this.trainings[this.trainingList[i]].lastRun = status.last_execution?.end || '';
          });
        }),
        map((statuses) => statuses.map((status) => status.status === TrainingStatus.running)),
      )
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((statuses) => {
        statuses.forEach((running, i) => {
          this.trainings[this.trainingList[i]].running = running;
        });
        markForCheck(this.cdr);
      });
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  toggleOption(type: TrainingType, value: string) {
    if (this.trainings[type].selectedOptions.includes(value)) {
      this.trainings[type].selectedOptions = this.trainings[type].selectedOptions.filter((item) => item !== value);
    } else {
      this.trainings[type].selectedOptions = [...this.trainings[type].selectedOptions, value];
    }
    markForCheck(this.cdr);
  }

  toggleAll(type: TrainingType) {
    this.options[type].pipe(take(1)).subscribe((options) => {
      const selectAll = this.trainings[type].selectedOptions.length < options.length;
      this.trainings[type].selectedOptions = selectAll ? options.map((item) => item.value) : [];
      markForCheck(this.cdr);
    });
  }

  startOrStopTraining(type: TrainingType) {
    this.sdk.currentKb
      .pipe(
        switchMap((kb) =>
          this.trainings[type].running
            ? kb.training.stop(type)
            : kb.training.start(
                type,
                type !== TrainingType.ner && this.trainings[type].selectedOptions.length > 0
                  ? this.trainings[type].selectedOptions
                  : undefined,
                // TODO: send entity groups in NER training
              ),
        ),
      )
      .subscribe(() => {
        this.trainings[type].running = !this.trainings[type].running;
        markForCheck(this.cdr);
      });
  }
}
