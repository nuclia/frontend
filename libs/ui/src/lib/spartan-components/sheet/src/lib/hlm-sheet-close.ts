// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnSheetClose } from '@spartan-ng/brain/sheet';

@Directive({
  selector: 'button[hlmSheetClose]',
  exportAs: 'hlmSheetClose',
  hostDirectives: [BrnSheetClose],
  host: { 'data-slot': 'sheet-close' },
})
export class HlmSheetClose {}
