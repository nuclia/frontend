// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnDrawerTrigger } from '@spartan-ng/brain/drawer';

@Directive({
  selector: 'button[hlmDrawerTrigger]',
  exportAs: 'hlmDrawerTrigger',
  hostDirectives: [
    { directive: BrnDrawerTrigger, inputs: ['id', 'direction', 'type'] },
  ],
  host: { 'data-slot': 'drawer-trigger' },
})
export class HlmDrawerTrigger {}
