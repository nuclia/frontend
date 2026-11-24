// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { ChangeDetectionStrategy, Component, forwardRef } from '@angular/core';
import {
  BrnDialog,
  provideBrnDialogDefaultOptions,
} from '@spartan-ng/brain/dialog';
import { BrnSheet } from '@spartan-ng/brain/sheet';
import { HlmSheetOverlay } from './hlm-sheet-overlay';

@Component({
  selector: 'hlm-sheet',
  exportAs: 'hlmSheet',
  imports: [HlmSheetOverlay],
  providers: [
    {
      provide: BrnDialog,
      useExisting: forwardRef(() => BrnSheet),
    },
    {
      provide: BrnSheet,
      useExisting: forwardRef(() => HlmSheet),
    },
    provideBrnDialogDefaultOptions({
      // add custom options here
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-sheet-overlay />
    <ng-content />
  `,
})
export class HlmSheet extends BrnSheet {}
