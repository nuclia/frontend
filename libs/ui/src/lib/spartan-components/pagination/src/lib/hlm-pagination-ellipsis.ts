import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matMoreHorizRound } from '@ng-icons/material-icons/round';
import { classes } from '@nuclia/ui-spartan/utils';

@Component({
  selector: 'hlm-pagination-ellipsis',
  exportAs: 'hlmPaginationEllipsis',
  imports: [NgIcon],
  providers: [provideIcons({ matMoreHorizRound })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-slot': 'pagination-ellipsis' },
  template: `
    <ng-icon name="matMoreHorizRound" />
    <span class="sr-only">{{ srOnlyText() }}</span>
  `,
})
export class HlmPaginationEllipsis {
  /** Screen reader only text for the ellipsis */
  public readonly srOnlyText = input<string>('More pages');

  constructor() {
    classes(
      () => "size-8 [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(4)] flex items-center justify-center",
    );
  }
}
