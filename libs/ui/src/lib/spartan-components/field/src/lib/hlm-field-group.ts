// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmFieldGroup],hlm-field-group',
  exportAs: 'hlmFieldGroup',
  host: { 'data-slot': 'field-group' },
})
export class HlmFieldGroup {
  constructor() {
    classes(
      () =>
        'gap-5 data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4 group/field-group @container/field-group flex w-full flex-col',
    );
  }
}
