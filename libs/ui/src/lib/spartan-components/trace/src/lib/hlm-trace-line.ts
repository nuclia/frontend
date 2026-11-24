// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive, input } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmTraceLine],hlm-trace-line',
  exportAs: 'hlmTraceLine',
  host: { 'data-slot': 'trace-line', '[attr.data-status]': 'status()' },
})
export class HlmTraceLine {
  public readonly status = input<'running' | 'error' | 'pending'>();

  constructor() {
    classes(
      () =>
        'gap-2 text-sm text-muted-foreground [a:hover,button:hover]:text-foreground data-[status=error]:text-destructive data-[status=error]:in-[a:hover,button:hover]:text-destructive data-[status=running]:*:data-[slot=trace-title]:shimmer flex w-fit max-w-full min-w-0 items-center transition-colors data-[status=pending]:opacity-60 [a,button]:cursor-pointer',
    );
  }
}
