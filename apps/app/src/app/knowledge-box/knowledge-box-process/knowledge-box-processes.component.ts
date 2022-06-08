import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

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

  constructor() {
  }

  ngOnInit(): void {
  }

  startOrStopTraining() {
    console.log('todo');
  }

}
