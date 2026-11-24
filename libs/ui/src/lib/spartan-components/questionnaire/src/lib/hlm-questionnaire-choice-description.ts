// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmQuestionnaireChoiceDescription]',
  exportAs: 'hlmQuestionnaireChoiceDescription',
  host: {
    'data-slot': 'questionnaire-choice-description',
  },
})
export class HlmQuestionnaireChoiceDescription {
  constructor() {
    classes(() => 'text-muted-foreground');
  }
}
