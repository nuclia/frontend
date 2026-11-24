// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { ChangeDetectionStrategy, Component, forwardRef } from '@angular/core';
import {
  BRN_ALERT_DIALOG_DEFAULT_OPTIONS,
  BrnAlertDialog,
} from '@spartan-ng/brain/alert-dialog';
import {
  BrnDialog,
  provideBrnDialogDefaultOptions,
} from '@spartan-ng/brain/dialog';
import { HlmAlertDialogOverlay } from './hlm-alert-dialog-overlay';

@Component({
  selector: 'hlm-alert-dialog',
  exportAs: 'hlmAlertDialog',
  imports: [HlmAlertDialogOverlay],
  providers: [
    {
      provide: BrnDialog,
      useExisting: forwardRef(() => HlmAlertDialog),
    },
    provideBrnDialogDefaultOptions({
      ...BRN_ALERT_DIALOG_DEFAULT_OPTIONS,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-alert-dialog-overlay />
    <ng-content />
  `,
})
export class HlmAlertDialog extends BrnAlertDialog {}
