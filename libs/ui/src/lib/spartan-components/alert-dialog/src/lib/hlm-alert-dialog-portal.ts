// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnAlertDialogContent } from '@spartan-ng/brain/alert-dialog';

@Directive({
  selector: '[hlmAlertDialogPortal]',
  exportAs: 'hlmAlertDialogPortal',
  hostDirectives: [
    { directive: BrnAlertDialogContent, inputs: ['context', 'class'] },
  ],
})
export class HlmAlertDialogPortal {}
