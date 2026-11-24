// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

export const hlmBlockquote = 'mt-6 border-border border-l-2 pl-6 italic';

@Directive({
  selector: '[hlmBlockquote]',
  exportAs: 'hlmBlockquote',
})
export class HlmBlockquote {
  constructor() {
    classes(() => hlmBlockquote);
  }
}
