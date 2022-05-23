import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'da-steps',
  templateUrl: './steps.component.html',
  styleUrls: ['./steps.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepsComponent {
  @Input() currentStep = 0;
  steps = [
    'upload.steps.sources',
    'upload.steps.files',
    'upload.steps.destination',
    'upload.steps.upload'
  ]
}

