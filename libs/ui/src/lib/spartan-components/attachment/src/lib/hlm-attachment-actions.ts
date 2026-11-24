// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmAttachmentActions],hlm-attachment-actions',
  exportAs: 'hlmAttachmentActions',
  host: { 'data-slot': 'attachment-actions' },
})
export class HlmAttachmentActions {
  constructor() {
    classes(
      () =>
        'shrink-0 items-center relative z-20 flex group-data-[orientation=horizontal]/attachment:self-start group-data-[orientation=vertical]/attachment:absolute group-data-[orientation=vertical]/attachment:end-3 group-data-[orientation=vertical]/attachment:top-3 group-data-[orientation=vertical]/attachment:gap-1',
    );
  }
}
