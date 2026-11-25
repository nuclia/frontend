// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnNavigationMenuContent } from '@spartan-ng/brain/navigation-menu';

@Directive({
  selector: '[hlmNavigationMenuPortal]',
  exportAs: 'hlmNavigationMenuPortal',
  hostDirectives: [BrnNavigationMenuContent],
})
export class HlmNavigationMenuPortal {}
