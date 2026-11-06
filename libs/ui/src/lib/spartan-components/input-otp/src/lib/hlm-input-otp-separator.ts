import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matRemoveRound } from '@ng-icons/material-icons/round';
import { classes } from '@nuclia/ui-spartan/utils';

@Component({
  selector: 'hlm-input-otp-separator',
  imports: [NgIcon],
  providers: [provideIcons({ matRemoveRound })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'separator',
    'data-slot': 'input-otp-separator',
  },
  template: `
    <ng-icon name="matRemoveRound" />
  `,
})
export class HlmInputOtpSeparator {
  constructor() {
    classes(() => "[&_ng-icon:not([class*='text-'])]:text-[length:--spacing(4)] flex items-center");
  }
}
