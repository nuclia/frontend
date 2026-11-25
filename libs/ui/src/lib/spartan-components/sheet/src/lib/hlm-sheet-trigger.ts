// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnSheetTrigger } from '@spartan-ng/brain/sheet';

@Directive({
  selector: 'button[hlmSheetTrigger]',
  exportAs: 'hlmSheetTrigger',
  hostDirectives: [
    { directive: BrnSheetTrigger, inputs: ['id', 'side', 'type'] },
  ],
  host: { 'data-slot': 'sheet-trigger' },
})
export class HlmSheetTrigger {}
