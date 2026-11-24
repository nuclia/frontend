// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmMessageFooter],hlm-message-footer',
  exportAs: 'hlmMessageFooter',
  host: { 'data-slot': 'message-footer' },
})
export class HlmMessageFooter {
  constructor() {
    classes(
      () =>
        'text-muted-foreground px-3 text-xs font-medium flex max-w-full min-w-0 items-center group-has-data-[variant=ghost]/message:px-0 group-data-[align=end]/message:justify-end',
    );
  }
}
