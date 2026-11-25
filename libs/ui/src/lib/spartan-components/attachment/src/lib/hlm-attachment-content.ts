// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmAttachmentContent],hlm-attachment-content',
  exportAs: 'hlmAttachmentContent',
  host: { 'data-slot': 'attachment-content' },
})
export class HlmAttachmentContent {
  constructor() {
    classes(
      () =>
        'min-w-0 flex-1 leading-tight max-w-full group-data-[orientation=vertical]/attachment:px-1',
    );
  }
}
