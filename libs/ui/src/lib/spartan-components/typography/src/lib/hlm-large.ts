// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

export const hlmLarge = 'text-lg font-semibold';

@Directive({
  selector: '[hlmLarge]',
  exportAs: 'hlmLarge',
})
export class HlmLarge {
  constructor() {
    classes(() => hlmLarge);
  }
}
