// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmQuestionnaireActions],hlm-questionnaire-actions',
  exportAs: 'hlmQuestionnaireActions',
  host: {
    'data-slot': 'questionnaire-actions',
  },
})
export class HlmQuestionnaireActions {
  constructor() {
    classes(
      () =>
        'min-h-11 gap-2 sm:min-h-8 grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center',
    );
  }
}
