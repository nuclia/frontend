// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmFieldTitle],hlm-field-title',
  exportAs: 'hlmFieldTitle',
  host: { 'data-slot': 'field-label' },
})
export class HlmFieldTitle {
  constructor() {
    classes(
      () =>
        'gap-2 text-sm leading-snug font-medium group-data-[disabled=true]/field:opacity-50 flex w-fit items-center',
    );
  }
}
