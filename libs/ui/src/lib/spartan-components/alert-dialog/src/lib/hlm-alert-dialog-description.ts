// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnAlertDialogDescription } from '@spartan-ng/brain/alert-dialog';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmAlertDialogDescription]',
  exportAs: 'hlmAlertDialogDescription',
  hostDirectives: [BrnAlertDialogDescription],
  host: { 'data-slot': 'alert-dialog-description' },
})
export class HlmAlertDialogDescription {
  constructor() {
    classes(
      () =>
        'text-muted-foreground *:[a]:hover:text-foreground text-sm text-balance md:text-pretty *:[a]:underline *:[a]:underline-offset-3',
    );
  }
}
