// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmCommandGroupLabel],hlm-command-group-label',
  exportAs: 'hlmCommandGroupLabel',
  host: {
    'data-slot': 'command-group-label',
    role: 'presentation',
  },
})
export class HlmCommandGroupLabel {
  constructor() {
    classes(() => 'inline-block');
  }
}
