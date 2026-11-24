// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

export const hlmUl = 'my-6 ml-6 list-disc [&>li]:mt-2';

@Directive({
  selector: '[hlmUl]',
  exportAs: 'hlmUl',
})
export class HlmUl {
  constructor() {
    classes(() => hlmUl);
  }
}
