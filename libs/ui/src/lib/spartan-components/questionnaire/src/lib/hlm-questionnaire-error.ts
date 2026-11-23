import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnQuestionnaireError } from '@spartan-ng/brain/questionnaire';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute selector matching brain API
  selector: '[hlmQuestionnaireError]',
  exportAs: 'hlmQuestionnaireError',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: BrnQuestionnaireError,
      inputs: ['id', 'requiredMessage', 'optionalMessage'],
    },
  ],
  host: {
    'data-slot': 'questionnaire-error',
  },
  template: `
    {{ message() ?? _error.defaultMessage() }}
  `,
})
export class HlmQuestionnaireError {
  protected readonly _error = inject(BrnQuestionnaireError);

  /** Custom error copy; falls back to the built-in required/optional message when unset. */
  public readonly message = input<string | undefined>(undefined);

  constructor() {
    classes(() => 'mt-2 text-sm text-destructive');
  }
}
