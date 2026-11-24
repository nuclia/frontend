// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnAutocompleteEmpty } from '@spartan-ng/brain/autocomplete';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmAutocompleteEmpty],hlm-autocomplete-empty',
  exportAs: 'hlmAutocompleteEmpty',
  hostDirectives: [BrnAutocompleteEmpty],
  host: { 'data-slot': 'autocomplete-empty' },
})
export class HlmAutocompleteEmpty {
  constructor() {
    classes(
      () =>
        'text-muted-foreground hidden w-full items-center justify-center py-2 text-center text-sm group-data-empty/autocomplete-content:flex',
    );
  }
}
