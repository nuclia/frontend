// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnDrawerContent } from '@spartan-ng/brain/drawer';

@Directive({
  selector: '[hlmDrawerPortal]',
  exportAs: 'hlmDrawerPortal',
  hostDirectives: [
    { directive: BrnDrawerContent, inputs: ['context', 'class'] },
  ],
})
export class HlmDrawerPortal {}
