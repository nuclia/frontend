// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnAlertDialogTrigger } from '@spartan-ng/brain/alert-dialog';

@Directive({
  selector: 'button[hlmAlertDialogTrigger],button[hlmAlertDialogTriggerFor]',
  exportAs: 'hlmAlertDialogTrigger',
  hostDirectives: [
    {
      directive: BrnAlertDialogTrigger,
      inputs: [
        'id',
        'brnAlertDialogTriggerFor: hlmAlertDialogTriggerFor',
        'type',
      ],
    },
  ],
  host: { 'data-slot': 'alert-dialog-trigger' },
})
export class HlmAlertDialogTrigger {}
