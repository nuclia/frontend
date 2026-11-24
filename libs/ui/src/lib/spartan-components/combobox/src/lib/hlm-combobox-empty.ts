// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnComboboxEmpty } from '@spartan-ng/brain/combobox';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmComboboxEmpty],hlm-combobox-empty',
  exportAs: 'hlmComboboxEmpty',
  hostDirectives: [BrnComboboxEmpty],
  host: { 'data-slot': 'combobox-empty' },
})
export class HlmComboboxEmpty {
  constructor() {
    classes(
      () =>
        'text-muted-foreground hidden w-full items-center justify-center py-2 text-center text-sm group-data-empty/combobox-content:flex',
    );
  }
}
