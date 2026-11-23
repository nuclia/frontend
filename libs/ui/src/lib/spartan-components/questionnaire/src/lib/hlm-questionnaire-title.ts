import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnQuestionnaireTitle } from '@spartan-ng/brain/questionnaire';

@Directive({
  selector: 'legend[hlmQuestionnaireTitle]',
  exportAs: 'hlmQuestionnaireTitle',
  hostDirectives: [{ directive: BrnQuestionnaireTitle }],
  host: {
    'data-slot': 'questionnaire-title',
  },
})
export class HlmQuestionnaireTitle {
  constructor() {
    classes(
      () => 'text-base leading-snug font-medium [&:not(:has(~[data-slot=questionnaire-description]))]:mb-4 text-pretty',
    );
  }
}
