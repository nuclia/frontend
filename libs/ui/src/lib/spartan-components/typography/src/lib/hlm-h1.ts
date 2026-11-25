// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

export const hlmH1 =
  'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl';

@Directive({
  selector: '[hlmH1]',
  exportAs: 'hlmH1',
})
export class HlmH1 {
  constructor() {
    classes(() => hlmH1);
  }
}
