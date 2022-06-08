import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { StateService } from "@flaps/auth";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { KnowledgeBox } from "@nuclia/core";

@Component({
  selector: 'app-knowledge-box-processes',
  templateUrl: './knowledge-box-processes.component.html',
  styleUrls: ['./knowledge-box-processes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KnowledgeBoxProcessesComponent implements OnInit {
  intent = false;
  labels = false;
  agreement = false;
  training = false;
  lastRun = '20-04-21';
  hoursRequired = 10;

  private _unsubscribeAll = new Subject<void>();
  private _kb: KnowledgeBox | undefined;

  constructor(private stateService: StateService,) {
  }

  ngOnInit(): void {
    this.stateService.stash.pipe(takeUntil(this._unsubscribeAll)).subscribe((data) => {
      this._kb = data || undefined;
      if (this._kb) {
        console.log(data);
      }
    });
  }

  startOrStopTraining() {
    console.log('todo');
  }

}
