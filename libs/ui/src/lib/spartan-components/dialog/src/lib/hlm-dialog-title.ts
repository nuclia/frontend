// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnDialogTitle } from '@spartan-ng/brain/dialog';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmDialogTitle]',
  exportAs: 'hlmDialogTitle',
  hostDirectives: [BrnDialogTitle],
  host: { 'data-slot': 'dialog-title' },
})
export class HlmDialogTitle {
  constructor() {
    classes(() => 'text-base leading-none font-medium');
  }
}
