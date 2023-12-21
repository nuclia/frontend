import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { markForCheck } from '@guillotinaweb/pastanaga-angular';
import { SDKService, STFTrackingService } from '@flaps/core';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { LabelSetKind, TrainingStatus, TrainingType } from '@nuclia/core';
import { forkJoin, Observable, shareReplay, Subject, take, tap } from 'rxjs';
import { getNerFamilyTitle } from '@flaps/common';
import { TranslateService } from '@ngx-translate/core';

interface TrainingState {
  agreement: boolean;
  running: boolean;
  selectedOptions: TrainingOption[];
  open: boolean;
  lastRun: string;
}

interface TrainingOption {
  value: string;
  title: string;
  multivalued?: boolean;
  kind?: LabelSetKind[];
}

@Component({
  selector: 'app-knowledge-box-training',
  templateUrl: './knowledge-box-training.component.html',
  styleUrls: ['./knowledge-box-training.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KnowledgeBoxTrainingComponent implements OnInit, OnDestroy {
  private unsubscribeAll: Subject<void> = new Subject();

  hasResources = this.sdk.counters.pipe(map((counters) => counters.resources > 0));
  cannotTrain = this.sdk.currentAccount.pipe(map((account) => account.type === 'stash-trial'));
  trainingTypes = TrainingType;
  labelSets: Observable<TrainingOption[]> = this.sdk.currentKb.pipe(
    switchMap((kb) => kb.getLabels()),
    map((labelsets) =>
      Object.entries(labelsets).map(([id, labelset]) => ({
        value: id,
        title: labelset.title,
        kind: labelset.kind,
        multivalued: labelset.multiple,
      })),
    ),
    shareReplay(),
  );
  entitiesGroups: Observable<TrainingOption[]> = this.sdk.currentKb.pipe(
    switchMap((kb) => kb.getEntities()),
    map((entities) =>
      Object.entries(entities)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([id, entity]) => ({
          value: id,
          title: getNerFamilyTitle(id, entity, this.translate),
        })),
    ),
    shareReplay(),
  );
  trainingList = [
    TrainingType.classifier,
    TrainingType.resource_labeler,
    TrainingType.paragraph_labeler,
    TrainingType.ner,
  ];
  trainings = this.trainingList.reduce(
    (acc, trainingType) => {
      acc[trainingType] = {
        agreement: false,
        running: false,
        selectedOptions: [],
        open: false,
        lastRun: '',
      };
      return acc;
    },
    {} as { [key in TrainingType]: TrainingState },
  );
  hoursRequired = 10;
  options: { [key: string]: Observable<{ value: string; title: string; kind?: LabelSetKind[] }[]> } = {
    [TrainingType.classifier]: this.labelSets,
    [TrainingType.resource_labeler]: this.labelSets.pipe(
      map((labelsets) => labelsets.filter((labelset) => labelset.kind?.includes(LabelSetKind.RESOURCES))),
    ),
    [TrainingType.paragraph_labeler]: this.labelSets.pipe(
      map((labelsets) =>
        labelsets.filter(
          (labelset) =>
            !labelset.kind?.includes(LabelSetKind.RESOURCES) && labelset.kind?.includes(LabelSetKind.PARAGRAPHS),
        ),
      ),
    ),
    [TrainingType.ner]: this.entitiesGroups,
  };

  isBillingEnabled = this.tracking.isFeatureEnabled('billing');
  enabledTrainings = this.tracking
    .isFeatureEnabled('training_ner')
    .pipe(map((enabled) => (enabled ? this.trainingList : this.trainingList.filter((t) => t !== TrainingType.ner))));

  constructor(
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
    private tracking: STFTrackingService,
    private translate: TranslateService,
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

  toggleOption(type: TrainingType, option: TrainingOption, event: Event) {
    if (this.isValidEvent(event)) {
      if (this.trainings[type].selectedOptions.includes(option)) {
        this.trainings[type].selectedOptions = this.trainings[type].selectedOptions.filter((item) => item !== option);
      } else {
        this.trainings[type].selectedOptions = [...this.trainings[type].selectedOptions, option];
      }
      markForCheck(this.cdr);
    }
  }

  updateSelection(type: TrainingType, option: TrainingOption, event: Event) {
    if (this.isValidEvent(event)) {
      if (this.trainings[type].selectedOptions.includes(option)) {
        this.trainings[type].selectedOptions = [];
      } else {
        this.trainings[type].selectedOptions = [option];
      }
      markForCheck(this.cdr);
    }
  }

  toggleAll(type: TrainingType, event: Event) {
    if (this.isValidEvent(event)) {
      this.options[type].pipe(take(1)).subscribe((options) => {
        const selectAll = this.trainings[type].selectedOptions.length < options.length;
        this.trainings[type].selectedOptions = selectAll ? options.map((option) => option) : [];
        markForCheck(this.cdr);
      });
    }
  }

  isValidEvent(event: Event) {
    return event.type === 'change' || (event.type === 'click' && (event.target as HTMLElement).tagName === 'LI');
  }

  startOrStopTraining(type: TrainingType) {
    let params: {
      valid_labelsets?: string[];
      valid_nertags?: string[];
      multivalued?: boolean;
    } = {};
    if (this.trainings[type].selectedOptions.length > 0) {
      params = {
        valid_labelsets:
          type !== TrainingType.ner ? this.trainings[type].selectedOptions.map((option) => option.value) : undefined,
        valid_nertags:
          type === TrainingType.ner ? this.trainings[type].selectedOptions.map((option) => option.value) : undefined,
      };
      if (type === TrainingType.resource_labeler || type === TrainingType.paragraph_labeler) {
        params.multivalued = this.trainings[type].selectedOptions[0].multivalued;
      }
    }
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) => (this.trainings[type].running ? kb.training.stop(type) : kb.training.start(type, params))),
      )
      .subscribe(() => {
        this.trainings[type].running = !this.trainings[type].running;
        markForCheck(this.cdr);
      });
  }

  getSelection(type: TrainingType) {
    return this.trainings[type].selectedOptions.map((option) => option.value).join(', ');
  }
}
