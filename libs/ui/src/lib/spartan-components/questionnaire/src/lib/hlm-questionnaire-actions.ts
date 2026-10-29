import { Directive } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
  selector: '[hlmQuestionnaireActions],hlm-questionnaire-actions',
  exportAs: 'hlmQuestionnaireActions',
  host: {
    'data-slot': 'questionnaire-actions',
  },
})
export class HlmQuestionnaireActions {
  constructor() {
    classes(() => 'gap-2 sm:min-h-8 grid min-h-11 w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center');
  }
}
