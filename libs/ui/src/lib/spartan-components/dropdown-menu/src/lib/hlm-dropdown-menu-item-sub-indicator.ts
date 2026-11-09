import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matChevronRightRound } from '@ng-icons/material-icons/round';
import { classes } from '@nuclia/ui-spartan/utils';

@Component({
  selector: 'hlm-dropdown-menu-item-sub-indicator',
  exportAs: 'hlmDropdownMenuItemSubIndicator',
  imports: [NgIcon],
  providers: [provideIcons({ matChevronRightRound })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-icon
      name="matChevronRightRound"
      class="text-[length:--spacing(4)] rtl:rotate-180" />
  `,
})
export class HlmDropdownMenuItemSubIndicator {
  constructor() {
    classes(() => 'ms-auto flex items-center justify-center');
  }
}
