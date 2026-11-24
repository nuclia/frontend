// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matRemoveRound } from '@ng-icons/material-symbols/round';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Component({
  selector: 'hlm-input-otp-separator',
  exportAs: 'hlmInputOtpSeparator',
  imports: [NgIcon],
  providers: [provideIcons({ matRemoveRound })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'separator',
    'data-slot': 'input-otp-separator',
  },
  template: ` <ng-icon name="matRemoveRound" /> `,
})
export class HlmInputOtpSeparator {
  constructor() {
    classes(
      () =>
        "[&_ng-icon:not([class*='text-'])]:text-[length:--spacing(4)] flex items-center",
    );
  }
}
