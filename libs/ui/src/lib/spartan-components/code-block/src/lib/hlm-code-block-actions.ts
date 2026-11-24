// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmCodeBlockActions],hlm-code-block-actions',
  exportAs: 'hlmCodeBlockActions',
  host: { 'data-slot': 'code-block-actions' },
})
export class HlmCodeBlockActions {
  constructor() {
    classes(
      () =>
        '[[data-slot=code-block]>&]:*:[button]:bg-background [[data-slot=code-block]>&]:*:[button]:ring-foreground/10 -my-1 -me-1.5 gap-1 [[data-slot=code-block]>&]:end-2 [[data-slot=code-block]>&]:top-2 [[data-slot=code-block]>&]:m-0 group-data-[size=sm]/code-block:[[data-slot=code-block]>&]:end-1.5 group-data-[size=sm]/code-block:[[data-slot=code-block]>&]:top-1.5 [[data-slot=code-block]>&]:*:[button]:ring-1 ms-auto flex shrink-0 items-center [[data-slot=code-block]>&]:absolute [[data-slot=code-block]>&]:z-10 [[data-slot=code-block]>&]:opacity-0 [[data-slot=code-block]>&]:transition-opacity [[data-slot=code-block]>&]:group-focus-within/code-block:opacity-100 [[data-slot=code-block]>&]:group-hover/code-block:opacity-100 [[data-slot=code-block]>&]:pointer-coarse:opacity-100',
    );
  }
}
