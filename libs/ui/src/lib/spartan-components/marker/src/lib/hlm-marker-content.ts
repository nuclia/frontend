// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmMarkerContent],hlm-marker-content',
  exportAs: 'hlmMarkerContent',
  host: { 'data-slot': 'marker-content' },
})
export class HlmMarkerContent {
  constructor() {
    classes(
      () =>
        'min-w-0 *:[a]:hover:text-foreground wrap-break-word group-data-[variant=separator]/marker:flex-none group-data-[variant=separator]/marker:text-center *:[a]:underline *:[a]:underline-offset-3',
    );
  }
}
