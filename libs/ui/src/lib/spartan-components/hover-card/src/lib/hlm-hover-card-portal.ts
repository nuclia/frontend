// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnHoverCardContent } from '@spartan-ng/brain/hover-card';

@Directive({
  selector: '[hlmHoverCardPortal],hlm-hover-card-portal',
  exportAs: 'hlmHoverCardPortal',
  hostDirectives: [BrnHoverCardContent],
})
export class HlmHoverCardPortal {}
