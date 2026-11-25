// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnAccordionContentLazy } from '@spartan-ng/brain/accordion';

@Directive({
  selector: 'ng-template[hlmAccordionContentLazy]',
  exportAs: 'hlmAccordionContentLazy',
  hostDirectives: [BrnAccordionContentLazy],
})
export class HlmAccordionContentLazy {}
