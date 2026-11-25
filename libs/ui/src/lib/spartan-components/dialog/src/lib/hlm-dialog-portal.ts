// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnDialogContent } from '@spartan-ng/brain/dialog';

@Directive({
  selector: '[hlmDialogPortal]',
  exportAs: 'hlmDialogPortal',
  hostDirectives: [
    { directive: BrnDialogContent, inputs: ['context', 'class'] },
  ],
})
export class HlmDialogPortal {}
