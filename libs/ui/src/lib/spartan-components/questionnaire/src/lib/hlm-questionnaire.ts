// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnQuestionnaire } from '@spartan-ng/brain/questionnaire';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: 'form[hlmQuestionnaire]',
  exportAs: 'hlmQuestionnaire',
  hostDirectives: [
    {
      directive: BrnQuestionnaire,
      inputs: ['items', 'defaultItem', 'item', 'shortcuts', 'noValidate'],
      outputs: ['itemChange'],
    },
  ],
  host: {
    'data-slot': 'questionnaire',
  },
})
export class HlmQuestionnaire {
  constructor() {
    classes(() => 'gap-4 flex w-full min-w-0 flex-col');
  }
}
