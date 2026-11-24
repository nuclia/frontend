// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnPopoverTrigger } from '@spartan-ng/brain/popover';

@Directive({
  selector: 'button[hlmPopoverTrigger],button[hlmPopoverTriggerFor]',
  exportAs: 'hlmPopoverTrigger',
  hostDirectives: [
    {
      directive: BrnPopoverTrigger,
      inputs: ['id', 'brnPopoverTriggerFor: hlmPopoverTriggerFor', 'type'],
    },
  ],
  host: { 'data-slot': 'popover-trigger' },
})
export class HlmPopoverTrigger {}
