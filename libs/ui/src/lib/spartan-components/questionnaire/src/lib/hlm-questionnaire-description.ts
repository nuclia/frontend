// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnQuestionnaireDescription } from '@spartan-ng/brain/questionnaire';
import { classes } from '@progress/pdp-ui-spartan/utils';

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
