// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnAlertDialogTitle } from '@spartan-ng/brain/alert-dialog';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmAlertDialogTitle]',
  exportAs: 'hlmAlertDialogTitle',
  hostDirectives: [BrnAlertDialogTitle],
  host: { 'data-slot': 'alert-dialog-title' },
})
export class HlmAlertDialogTitle {
  constructor() {
    classes(
      () =>
        'text-base font-medium sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2',
    );
  }
}
