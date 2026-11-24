// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnAutocompleteStatus } from '@spartan-ng/brain/autocomplete';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmAutocompleteStatus],hlm-autocomplete-status',
  exportAs: 'hlmAutocompleteStatus',
  hostDirectives: [BrnAutocompleteStatus],
  host: { 'data-slot': 'autocomplete-status' },
})
export class HlmAutocompleteStatus {
  constructor() {
    classes(
      () =>
        'text-muted-foreground gap-2 px-2.5 py-2 text-sm flex w-full items-center justify-center text-center',
    );
  }
}
