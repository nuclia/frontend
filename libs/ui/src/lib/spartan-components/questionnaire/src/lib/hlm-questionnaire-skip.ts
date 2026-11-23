import { Directive, input } from '@angular/core';
import { type ButtonVariants, buttonVariants } from '@progress/pdp-ui-spartan/button';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnQuestionnaireSkip } from '@spartan-ng/brain/questionnaire';

@Directive({
  selector: 'button[hlmQuestionnaireSkip]',
  exportAs: 'hlmQuestionnaireSkip',
  hostDirectives: [
    {
      directive: BrnQuestionnaireSkip,
      inputs: ['disabled'],
    },
  ],
  host: {
    'data-slot': 'questionnaire-skip',
    '[attr.data-size]': 'size()',
    '[attr.data-variant]': 'variant()',
  },
})
export class HlmQuestionnaireSkip {
  public readonly variant = input<ButtonVariants['variant']>('outline');
  public readonly size = input<ButtonVariants['size']>('default');

  constructor() {
    classes(() => [
      buttonVariants({ variant: this.variant(), size: this.size() }),
      'col-start-2 row-start-1 min-h-11 justify-self-end sm:min-h-0',
    ]);
  }
}
