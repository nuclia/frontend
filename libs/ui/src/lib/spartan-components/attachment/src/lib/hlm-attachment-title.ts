// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmAttachmentTitle],hlm-attachment-title',
  exportAs: 'hlmAttachmentTitle',
  host: { 'data-slot': 'attachment-title' },
})
export class HlmAttachmentTitle {
  constructor() {
    classes(
      () =>
        'truncate text-sm font-medium group-data-[state=error]/attachment:text-destructive group-data-[state=processing]/attachment:shimmer group-data-[state=uploading]/attachment:shimmer block max-w-full min-w-0',
    );
  }
}
