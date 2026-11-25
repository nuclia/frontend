// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnDrawerClose } from '@spartan-ng/brain/drawer';

@Directive({
  selector: 'button[hlmDrawerClose]',
  exportAs: 'hlmDrawerClose',
  hostDirectives: [BrnDrawerClose],
  host: { 'data-slot': 'drawer-close' },
})
export class HlmDrawerClose {}
