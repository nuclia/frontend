// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive, inject } from '@angular/core';
import { BrnSelectValue } from '@spartan-ng/brain/select';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmSelectValue],hlm-select-value',
  exportAs: 'hlmSelectValue',
  hostDirectives: [{ directive: BrnSelectValue, inputs: ['placeholder'] }],
  host: { '[attr.data-slot]': '!_hidden() ? "select-value" : null' },
})
export class HlmSelectValue {
  private readonly _brnSelectValue = inject(BrnSelectValue);

  protected readonly _hidden = this._brnSelectValue.hidden;

  constructor() {
    classes(() => 'data-hidden:hidden');
  }
}
