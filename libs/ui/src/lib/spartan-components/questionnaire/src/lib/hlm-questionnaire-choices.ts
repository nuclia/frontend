import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnQuestionnaireChoices } from '@spartan-ng/brain/questionnaire';

@Directive({
  selector: '[hlmQuestionnaireChoices]',
  exportAs: 'hlmQuestionnaireChoices',
  hostDirectives: [{ directive: BrnQuestionnaireChoices }],
  host: {
    'data-slot': 'questionnaire-choices',
  },
})
export class HlmQuestionnaireChoices {
  constructor() {
    classes(() => 'gap-2 group/questionnaire-choices grid min-w-0');
  }
}
