// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmCardFooter],hlm-card-footer',
  exportAs: 'hlmCardFooter',
  host: { 'data-slot': 'card-footer' },
})
export class HlmCardFooter {
  constructor() {
    classes(
      () =>
        'bg-muted/50 rounded-b-xl border-t p-(--card-spacing) flex items-center',
    );
  }
}
