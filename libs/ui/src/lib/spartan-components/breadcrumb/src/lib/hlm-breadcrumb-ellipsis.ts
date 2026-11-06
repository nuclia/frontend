import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matMoreHorizRound } from '@ng-icons/material-icons/round';
import { classes } from '@nuclia/ui-spartan/utils';

@Component({
  selector: 'hlm-breadcrumb-ellipsis',
  imports: [NgIcon],
  providers: [provideIcons({ matMoreHorizRound })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'breadcrumb-ellipsis',
    role: 'presentation',
  },
  template: `
    <ng-icon name="matMoreHorizRound" />
    <span class="sr-only">{{ srOnlyText() }}</span>
  `,
})
export class HlmBreadcrumbEllipsis {
  /** Screen reader only text for the ellipsis */
  public readonly srOnlyText = input<string>('More');

  constructor() {
    classes(() => 'size-5 [&>ng-icon]:text-[length:--spacing(4)] flex items-center justify-center');
  }
}
