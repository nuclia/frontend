// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnAutocompleteGroup } from '@spartan-ng/brain/autocomplete';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmAutocompleteGroup]',
  exportAs: 'hlmAutocompleteGroup',
  hostDirectives: [BrnAutocompleteGroup],
  host: { 'data-slot': 'autocomplete-group' },
})
export class HlmAutocompleteGroup {
  constructor() {
    classes(() => 'data-hidden:hidden');
  }
}
