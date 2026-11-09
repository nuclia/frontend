import type { BooleanInput } from '@angular/cdk/coercion';
import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matCloseRound } from '@ng-icons/material-icons/round';
import { classes } from '@nuclia/ui-spartan/utils';
import { BrnComboboxChip } from '@spartan-ng/brain/combobox';
import { HlmComboboxChipRemove } from './hlm-combobox-chip-remove';

@Component({
  selector: 'hlm-combobox-chip',
  exportAs: 'hlmComboboxChip',
  imports: [NgIcon, HlmComboboxChipRemove],
  providers: [provideIcons({ matCloseRound })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: BrnComboboxChip, inputs: ['value'] }],
  host: { 'data-slot': 'combobox-chip' },
  template: `
    <ng-content />

    @if (showRemove()) {
      <button hlmComboboxChipRemove>
        <ng-icon name="matCloseRound" />
      </button>
    }
  `,
})
export class HlmComboboxChip {
  public readonly showRemove = input<boolean, BooleanInput>(true, { transform: booleanAttribute });

  constructor() {
    classes(
      () =>
        'bg-muted text-foreground flex h-[calc(--spacing(5.25))] w-fit items-center justify-center gap-1 rounded-sm px-1.5 text-xs font-medium whitespace-nowrap has-data-[slot=combobox-chip-remove]:pe-0 has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50',
    );
  }
}
