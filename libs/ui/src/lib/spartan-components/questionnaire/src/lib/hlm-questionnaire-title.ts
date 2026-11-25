// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnQuestionnaireTitle } from '@spartan-ng/brain/questionnaire';
import { classes } from '@progress/pdp-ui-spartan/utils';

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
      () =>
        'text-base leading-snug font-medium [&:not(:has(~[data-slot=questionnaire-description]))]:mb-4 text-pretty',
    );
  }
}
