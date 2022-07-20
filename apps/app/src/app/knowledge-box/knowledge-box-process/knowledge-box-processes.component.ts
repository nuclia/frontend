import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { SDKService, StateService } from '@flaps/core';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { TrainingType } from '@nuclia/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-knowledge-box-processes',
  templateUrl: './knowledge-box-processes.component.html',
  styleUrls: ['./knowledge-box-processes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KnowledgeBoxProcessesComponent implements OnInit, OnDestroy {
  intent = false;
  labels = false;
  agreement = false;
  training = false;
  lastRun = '20-04-21';
  hoursRequired = 10;
  cannotTrain = this.stateService.account.pipe(map((account) => account && account.type === 'stash-basic'));
  private unsubscribeAll: Subject<void> = new Subject();

  constructor(private sdk: SDKService, private stateService: StateService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.sdk.currentKb
      .pipe(
        switchMap((kb) => kb.training.getStatus(TrainingType.labeller)),
        map((status) => status.status !== 'not_running'), // we need an enum for the status values, but I do not know them for now
      )
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((isTraining) => (this.training = isTraining));
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  startOrStopTraining() {
    this.sdk.currentKb
      .pipe(
        switchMap((kb) =>
          this.training ? kb.training.stop(TrainingType.labeller) : kb.training.start(TrainingType.labeller),
        ),
      )
      .subscribe(() => {
        this.training = !this.training;
        this.cdr.markForCheck();
      });
  }
}
