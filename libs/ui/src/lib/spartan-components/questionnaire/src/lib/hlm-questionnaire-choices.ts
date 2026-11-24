// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnQuestionnaireChoices } from '@spartan-ng/brain/questionnaire';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmQuestionnaireChoices]',
  exportAs: 'hlmQuestionnaireChoices',
  hostDirectives: [{ directive: BrnQuestionnaireChoices }],
  host: {
    'data-slot': 'questionnaire-choices',
  },
})
export class HlmQuestionnaireChoices {
  constructor() {
    classes(() => 'gap-2 group/questionnaire-choices grid min-w-0');
  }
}
