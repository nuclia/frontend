import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnQuestionnaireItem } from '@spartan-ng/brain/questionnaire';

@Directive({
  selector: 'fieldset[hlmQuestionnaireItem]',
  exportAs: 'hlmQuestionnaireItem',
  hostDirectives: [
    {
      directive: BrnQuestionnaireItem,
      inputs: ['name', 'multiple', 'required', 'disabled', 'itemInvalid', 'aria-describedby', 'aria-keyshortcuts'],
      outputs: ['statusChange'],
    },
  ],
  host: {
    'data-slot': 'questionnaire-item',
  },
})
export class HlmQuestionnaireItem {
  constructor() {
    classes(() => 'gap-4 flex min-w-0 flex-col border-0 p-0 outline-none');
  }
}
