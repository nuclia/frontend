// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

export const hlmSmall = 'text-sm font-medium leading-none';

@Directive({
  selector: '[hlmSmall]',
  exportAs: 'hlmSmall',
})
export class HlmSmall {
  constructor() {
    classes(() => hlmSmall);
  }
}
