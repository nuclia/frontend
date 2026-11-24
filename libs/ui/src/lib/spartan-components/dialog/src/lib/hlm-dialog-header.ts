// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmDialogHeader],hlm-dialog-header',
  exportAs: 'hlmDialogHeader',
  host: { 'data-slot': 'dialog-header' },
})
export class HlmDialogHeader {
  constructor() {
    classes(() => 'gap-2 flex flex-col');
  }
}
