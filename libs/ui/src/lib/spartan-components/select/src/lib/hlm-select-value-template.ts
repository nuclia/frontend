// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnSelectValueTemplate } from '@spartan-ng/brain/select';

@Directive({
  selector: '[hlmSelectValueTemplate]',
  exportAs: 'hlmSelectValueTemplate',
  hostDirectives: [BrnSelectValueTemplate],
})
export class HlmSelectValueTemplate {}
