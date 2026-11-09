import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matCheckRound } from '@ng-icons/material-icons/round';
import { classes } from '@nuclia/ui-spartan/utils';
import { BrnComboboxItem } from '@spartan-ng/brain/combobox';

@Component({
  selector: 'hlm-combobox-item',
  exportAs: 'hlmComboboxItem',
  imports: [NgIcon],
  providers: [provideIcons({ matCheckRound })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: BrnComboboxItem, inputs: ['id', 'disabled', 'value'] }],
  host: { 'data-slot': 'combobox-item' },
  template: `
    <ng-content />
    @if (_active()) {
      <ng-icon
        name="matCheckRound"
        class="pointer-events-none absolute end-2 flex items-center justify-center text-[length:--spacing(4)]"
        aria-hidden="true" />
    }
  `,
})
export class HlmComboboxItem {
  private readonly _brnComboboxItem = inject(BrnComboboxItem);

  protected readonly _active = this._brnComboboxItem.active;

  constructor() {
    classes(
      () =>
        'data-highlighted:bg-accent data-highlighted:text-accent-foreground not-data-[variant=destructive]:data-highlighted:**:text-accent-foreground gap-2 rounded-md py-1 ps-1.5 pe-8 text-sm relative flex w-full cursor-default items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-hidden:hidden [&_ng-icon]:pointer-events-none [&_ng-icon]:shrink-0',
    );
  }
}
