// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnComboboxValueTemplate } from '@spartan-ng/brain/combobox';

@Directive({
  selector: '[hlmComboboxValueTemplate]',
  exportAs: 'hlmComboboxValueTemplate',
  hostDirectives: [BrnComboboxValueTemplate],
})
export class HlmComboboxValueTemplate {}
