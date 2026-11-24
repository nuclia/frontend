// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmCommandEmpty]',
  exportAs: 'hlmCommandEmpty',
  host: {
    'data-slot': 'command-empty',
  },
})
export class HlmCommandEmpty {
  constructor() {
    classes(() => 'py-6 text-center text-sm');
  }
}
