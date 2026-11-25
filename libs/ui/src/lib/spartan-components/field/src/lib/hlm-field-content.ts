// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmFieldContent],hlm-field-content',
  exportAs: 'hlmFieldContent',
  host: { 'data-slot': 'field-content' },
})
export class HlmFieldContent {
  constructor() {
    classes(
      () => 'gap-0.5 group/field-content flex flex-1 flex-col leading-snug',
    );
  }
}
