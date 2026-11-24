// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmAlertAction]',
  exportAs: 'hlmAlertAction',
  host: {
    'data-slot': 'alert-action',
  },
})
export class HlmAlertAction {
  constructor() {
    classes(() => 'absolute end-2 top-2');
  }
}
