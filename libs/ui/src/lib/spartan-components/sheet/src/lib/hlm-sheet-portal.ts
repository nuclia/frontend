// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnSheetContent } from '@spartan-ng/brain/sheet';

@Directive({
  selector: '[hlmSheetPortal]',
  exportAs: 'hlmSheetPortal',
  hostDirectives: [
    { directive: BrnSheetContent, inputs: ['context', 'class'] },
  ],
})
export class HlmSheetPortal {}
