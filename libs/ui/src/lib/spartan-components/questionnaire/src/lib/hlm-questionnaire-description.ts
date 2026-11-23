import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnQuestionnaireDescription } from '@spartan-ng/brain/questionnaire';

@Directive({
  selector: '[hlmQuestionnaireDescription]',
  exportAs: 'hlmQuestionnaireDescription',
  hostDirectives: [
    {
      directive: BrnQuestionnaireDescription,
      inputs: ['id'],
    },
  ],
  host: {
    'data-slot': 'questionnaire-description',
  },
})
export class HlmQuestionnaireDescription {
  constructor() {
    classes(() => 'text-sm text-muted-foreground text-pretty');
  }
}
