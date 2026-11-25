// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnComboboxValues } from '@spartan-ng/brain/combobox';

@Directive({
  selector: '[hlmComboboxValues]',
  exportAs: 'hlmComboboxValues',
  hostDirectives: [BrnComboboxValues],
})
export class HlmComboboxValues {}
