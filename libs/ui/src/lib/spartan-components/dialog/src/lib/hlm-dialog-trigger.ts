// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnDialogTrigger } from '@spartan-ng/brain/dialog';

@Directive({
  selector: 'button[hlmDialogTrigger],button[hlmDialogTriggerFor]',
  exportAs: 'hlmDialogTrigger',
  hostDirectives: [
    {
      directive: BrnDialogTrigger,
      inputs: ['id', 'brnDialogTriggerFor: hlmDialogTriggerFor', 'type'],
    },
  ],
  host: { 'data-slot': 'dialog-trigger' },
})
export class HlmDialogTrigger {}
