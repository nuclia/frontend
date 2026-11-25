// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnPopoverContent } from '@spartan-ng/brain/popover';

@Directive({
  selector: '[hlmSelectPortal]',
  exportAs: 'hlmSelectPortal',
  hostDirectives: [
    { directive: BrnPopoverContent, inputs: ['context', 'class'] },
  ],
})
export class HlmSelectPortal {}
