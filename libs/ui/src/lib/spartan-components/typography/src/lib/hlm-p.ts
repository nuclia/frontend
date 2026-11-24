// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

export const hlmP = 'leading-7 [&:not(:first-child)]:mt-6';

@Directive({
  selector: '[hlmP]',
  exportAs: 'hlmP',
})
export class HlmP {
  constructor() {
    classes(() => hlmP);
  }
}
