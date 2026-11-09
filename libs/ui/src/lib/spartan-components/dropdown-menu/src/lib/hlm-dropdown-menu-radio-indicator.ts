import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matCheckRound } from '@ng-icons/material-icons/round';
import { classes } from '@nuclia/ui-spartan/utils';

@Component({
  selector: 'hlm-dropdown-menu-radio-indicator',
  exportAs: 'hlmDropdownMenuRadioIndicator',
  imports: [NgIcon],
  providers: [provideIcons({ matCheckRound })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-slot': 'dropdown-menu-radio-item-indicator' },
  template: `
    <ng-icon name="matCheckRound" />
  `,
})
export class HlmDropdownMenuRadioIndicator {
  constructor() {
    classes(
      () =>
        'absolute end-2 flex items-center justify-center [&_ng-icon]:text-[length:--spacing(4)] pointer-events-none opacity-0 group-data-checked/dropdown-menu-radio:opacity-100',
    );
  }
}
