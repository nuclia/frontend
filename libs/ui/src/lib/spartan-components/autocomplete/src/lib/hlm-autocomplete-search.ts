// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnAutocompleteSearch } from '@spartan-ng/brain/autocomplete';
import {
  BrnPopover,
  provideBrnPopoverConfig,
  provideBrnPopoverDefaultOptions,
} from '@spartan-ng/brain/popover';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmAutocompleteSearch],hlm-autocomplete-search',
  exportAs: 'hlmAutocompleteSearch',
  providers: [
    provideBrnPopoverConfig({
      align: 'start',
      sideOffset: 6,
    }),
    provideBrnPopoverDefaultOptions({ role: null }),
  ],
  hostDirectives: [
    {
      directive: BrnAutocompleteSearch,
      inputs: ['autoHighlight', 'disabled', 'value', 'search', 'itemToString'],
      outputs: ['valueChange', 'searchChange'],
    },
    {
      directive: BrnPopover,
      inputs: [
        'align',
        'closeOnOutsidePointerEvents',
        'sideOffset',
        'state',
        'offsetX',
        'scrollStrategy',
      ],
      outputs: ['stateChanged', 'closed'],
    },
  ],
  host: { 'data-slot': 'autocomplete' },
})
export class HlmAutocompleteSearch {
  constructor() {
    classes(() => 'block');
  }
}
