// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { CdkStepperPrevious } from '@angular/cdk/stepper';
import { Directive } from '@angular/core';

/** Button that moves to the previous step in a stepper workflow. */
@Directive({
  selector: 'button[uiStepperPrevious]',
  host: {
    class: 'ui-stepper-previous',
    '[type]': 'type',
    '[style.touch-action]': '"manipulation"',
  },
})
export class UiStepperPrevious extends CdkStepperPrevious {}
