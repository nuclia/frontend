// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnTabsContentLazy } from '@spartan-ng/brain/tabs';

@Directive({
  selector: 'ng-template[hlmTabsContentLazy]',
  exportAs: 'hlmTabsContentLazy',
  hostDirectives: [BrnTabsContentLazy],
})
export class HlmTabsContentLazy {}
