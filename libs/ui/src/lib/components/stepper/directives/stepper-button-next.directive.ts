import { CdkStepperNext } from '@angular/cdk/stepper';
import { Directive } from '@angular/core';

/** Button that moves to the next step in a stepper workflow. */
@Directive({
  selector: 'button[uiStepperNext]',
  host: {
    class: 'ui-stepper-next',
    '[type]': 'type',
    '[style.touch-action]': '"manipulation"',
  },
})
export class UiStepperNext extends CdkStepperNext {}
