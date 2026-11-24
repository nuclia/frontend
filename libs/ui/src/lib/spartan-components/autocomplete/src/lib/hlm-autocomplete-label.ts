// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnAutocompleteLabel } from '@spartan-ng/brain/autocomplete';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmAutocompleteLabel]',
  exportAs: 'hlmAutocompleteLabel',
  hostDirectives: [{ directive: BrnAutocompleteLabel, inputs: ['id'] }],
  host: { 'data-slot': 'autocomplete-label' },
})
export class HlmAutocompleteLabel {
  constructor() {
    classes(() => 'text-muted-foreground px-2 py-1.5 text-xs');
  }
}
