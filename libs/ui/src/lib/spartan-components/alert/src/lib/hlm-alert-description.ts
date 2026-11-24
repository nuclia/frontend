// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmAlertDescription]',
  exportAs: 'hlmAlertDescription',
  host: {
    'data-slot': 'alert-description',
  },
})
export class HlmAlertDescription {
  constructor() {
    classes(
      () =>
        'text-muted-foreground text-sm text-balance md:text-pretty [&_p:not(:last-child)]:mb-4 [&_a]:hover:text-foreground [&_a]:underline [&_a]:underline-offset-3',
    );
  }
}
