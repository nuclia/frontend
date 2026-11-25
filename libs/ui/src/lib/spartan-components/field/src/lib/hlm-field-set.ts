// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: 'fieldset[hlmFieldSet]',
  exportAs: 'hlmFieldSet',
  host: { 'data-slot': 'field-set' },
})
export class HlmFieldSet {
  constructor() {
    classes(
      () =>
        'gap-4 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3 flex flex-col',
    );
  }
}
