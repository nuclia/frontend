import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matChevronRightRound } from '@ng-icons/material-icons/round';
import { classes } from '@nuclia/ui-spartan/utils';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[hlmBreadcrumbSeparator]',
  exportAs: 'hlmBreadcrumbSeparator',
  imports: [NgIcon],
  providers: [provideIcons({ matChevronRightRound })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'breadcrumb-separator',
    role: 'presentation',
    'aria-hidden': 'true',
  },
  template: `
    <ng-content>
      <ng-icon name="matChevronRightRound" />
    </ng-content>
  `,
})
export class HlmBreadcrumbSeparator {
  constructor() {
    classes(() => '[&>ng-icon]:text-[length:--spacing(3.5)] [&>ng-icon]:flex');
  }
}
