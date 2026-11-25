// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnQuestionnaireItem } from '@spartan-ng/brain/questionnaire';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: 'fieldset[hlmQuestionnaireItem]',
  exportAs: 'hlmQuestionnaireItem',
  hostDirectives: [
    {
      directive: BrnQuestionnaireItem,
      inputs: [
        'name',
        'multiple',
        'required',
        'disabled',
        'itemInvalid',
        'aria-describedby',
        'aria-keyshortcuts',
      ],
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
