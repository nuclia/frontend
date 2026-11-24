// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmCardAction]',
  exportAs: 'hlmCardAction',
  host: { 'data-slot': 'card-action' },
})
export class HlmCardAction {
  constructor() {
    classes(
      () => 'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
    );
  }
}
