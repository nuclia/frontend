// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import {
  BrnPopover,
  provideBrnPopoverConfig,
  provideBrnPopoverDefaultOptions,
} from '@spartan-ng/brain/popover';
import { BrnSelect } from '@spartan-ng/brain/select';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmSelect],hlm-select',
  exportAs: 'hlmSelect',
  providers: [
    provideBrnPopoverConfig({
      align: 'start',
      sideOffset: 6,
    }),
    provideBrnPopoverDefaultOptions({ role: null }),
  ],
  hostDirectives: [
    {
      directive: BrnSelect,
      inputs: ['disabled', 'value', 'isItemEqualToValue', 'itemToString'],
      outputs: ['valueChange'],
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
  host: { 'data-slot': 'select' },
})
export class HlmSelect {
  constructor() {
    classes(() => 'block');
  }
}
