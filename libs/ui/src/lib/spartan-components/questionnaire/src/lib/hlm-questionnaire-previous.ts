// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive, input } from '@angular/core';
import { BrnQuestionnairePrevious } from '@spartan-ng/brain/questionnaire';
import {
  type ButtonVariants,
  buttonVariants,
} from '@progress/pdp-ui-spartan/button';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: 'button[hlmQuestionnairePrevious]',
  exportAs: 'hlmQuestionnairePrevious',
  hostDirectives: [
    {
      directive: BrnQuestionnairePrevious,
      inputs: ['disabled'],
    },
  ],
  host: {
    'data-slot': 'questionnaire-previous',
    '[attr.data-size]': 'size()',
    '[attr.data-variant]': 'variant()',
  },
})
export class HlmQuestionnairePrevious {
  public readonly variant = input<ButtonVariants['variant']>('outline');
  public readonly size = input<ButtonVariants['size']>('default');

  constructor() {
    classes(() => [
      buttonVariants({ variant: this.variant(), size: this.size() }),
      'col-start-1 row-start-1 min-h-11 justify-self-start sm:min-h-0',
    ]);
  }
}
