// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnDialogClose } from '@spartan-ng/brain/dialog';

@Directive({
  selector: 'button[hlmDialogClose]',
  exportAs: 'hlmDialogClose',
  hostDirectives: [BrnDialogClose],
  host: { 'data-slot': 'dialog-close' },
})
export class HlmDialogClose {}
