import { Component, Input, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'nde-steps',
  templateUrl: './steps.component.html',
  styleUrls: ['./steps.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepsComponent {
  @Input() currentStep = 0;
  @Output() goBackTo = new EventEmitter<number>();
  steps = ['upload.steps.sources', 'upload.steps.files', 'upload.steps.destination', 'upload.steps.upload'];

  goToStep(step: number) {
    if (step < this.currentStep) {
      this.goBackTo.emit(step);
    }
  }
}
