// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

export const hlmH3 = 'scroll-m-20 text-2xl font-semibold tracking-tight';

@Directive({
  selector: '[hlmH3]',
  exportAs: 'hlmH3',
})
export class HlmH3 {
  constructor() {
    classes(() => hlmH3);
  }
}
