// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { ChangeDetectionStrategy, Component, forwardRef } from '@angular/core';
import {
  BrnDialog,
  provideBrnDialogDefaultOptions,
} from '@spartan-ng/brain/dialog';
import { HlmDialogOverlay } from './hlm-dialog-overlay';

@Component({
  selector: 'hlm-dialog',
  exportAs: 'hlmDialog',
  imports: [HlmDialogOverlay],
  providers: [
    {
      provide: BrnDialog,
      useExisting: forwardRef(() => HlmDialog),
    },
    provideBrnDialogDefaultOptions({
      // add custom options here
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-dialog-overlay />
    <ng-content />
  `,
})
export class HlmDialog extends BrnDialog {}
