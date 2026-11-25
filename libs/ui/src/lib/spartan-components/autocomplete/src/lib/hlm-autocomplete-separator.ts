// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnAutocompleteSeparator } from '@spartan-ng/brain/autocomplete';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmAutocompleteSeparator]',
  exportAs: 'hlmAutocompleteSeparator',
  hostDirectives: [
    { directive: BrnAutocompleteSeparator, inputs: ['orientation'] },
  ],
  host: { 'data-slot': 'autocomplete-separator' },
})
export class HlmAutocompleteSeparator {
  constructor() {
    classes(() => 'bg-border -mx-1 my-1 h-px');
  }
}
