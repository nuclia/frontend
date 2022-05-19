import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

type ProgressBarTrackColor = 'white' | 'gray';

@Component({
  selector: 'stf-progress-bar',
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBarComponent {
  @Input() progress: number = 0;
  @Input() track: ProgressBarTrackColor = 'gray';

  constructor() {}
}