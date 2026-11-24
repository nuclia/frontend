// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { HlmInput } from '@progress/pdp-ui-spartan/input';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: 'input[hlmInputGroupInput]',
  exportAs: 'hlmInputGroupInput',
  hostDirectives: [HlmInput],
  host: { 'data-slot': 'input-group-control' },
})
export class HlmInputGroupInput {
  constructor() {
    classes(
      () =>
        `rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent data-[matches-spartan-invalid=true]:ring-0 dark:bg-transparent dark:disabled:bg-transparent flex-1`,
    );
  }
}
