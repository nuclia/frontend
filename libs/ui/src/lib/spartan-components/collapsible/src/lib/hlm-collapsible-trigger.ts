// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnCollapsibleTrigger } from '@spartan-ng/brain/collapsible';

@Directive({
  selector: 'button[hlmCollapsibleTrigger]',
  exportAs: 'hlmCollapsibleTrigger',
  hostDirectives: [{ directive: BrnCollapsibleTrigger, inputs: ['type'] }],
  host: { 'data-slot': 'collapsible-trigger' },
})
export class HlmCollapsibleTrigger {}
