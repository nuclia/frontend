// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnCommandEmpty } from '@spartan-ng/brain/command';

@Directive({
  selector: '[hlmCommandEmptyState]',
  exportAs: 'hlmCommandEmptyState',
  hostDirectives: [BrnCommandEmpty],
})
export class HlmCommandEmptyState {}
