import { Directive, input } from '@angular/core';
import { type ButtonVariants, buttonVariants } from '@progress/pdp-ui-spartan/button';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnQuestionnaireNext } from '@spartan-ng/brain/questionnaire';

@Directive({
  selector: 'button[hlmQuestionnaireNext]',
  exportAs: 'hlmQuestionnaireNext',
  hostDirectives: [
    {
      directive: BrnQuestionnaireNext,
      inputs: ['disabled'],
    },
  ],
  host: {
    'data-slot': 'questionnaire-next',
    '[attr.data-size]': 'size()',
    '[attr.data-variant]': 'variant()',
  },
})
export class HlmQuestionnaireNext {
  public readonly variant = input<ButtonVariants['variant']>('default');
  public readonly size = input<ButtonVariants['size']>('default');

  constructor() {
    classes(() => [
      buttonVariants({ variant: this.variant(), size: this.size() }),
      'col-start-3 row-start-1 min-h-11 justify-self-end sm:min-h-0',
    ]);
  }
}
