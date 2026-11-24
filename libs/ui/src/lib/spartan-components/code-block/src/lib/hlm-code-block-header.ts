// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmCodeBlockHeader],hlm-code-block-header',
  exportAs: 'hlmCodeBlockHeader',
  host: { 'data-slot': 'code-block-header' },
})
export class HlmCodeBlockHeader {
  constructor() {
    classes(
      () =>
        'text-muted-foreground group-data-[variant=destructive]/code-block:text-destructive gap-2 px-3 pt-3 group-data-[size=sm]/code-block:px-2.5 group-data-[size=sm]/code-block:pt-2.5 flex min-w-0 shrink-0 items-center *:has-[>[data-slot=code-block-title]]:min-w-0',
    );
  }
}
