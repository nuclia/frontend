import { Directive } from '@angular/core';
import { BrnComboboxChipRemove } from '@spartan-ng/brain/combobox';
import { buttonVariants } from '@nuclia/ui-spartan/button';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
	selector: 'button[hlmComboboxChipRemove]',
	hostDirectives: [BrnComboboxChipRemove],
	host: { 'data-slot': 'combobox-chip-remove' },
})
export class HlmComboboxChipRemove {
	constructor() {
		classes(() => ['-ms-1 opacity-50 hover:opacity-100', buttonVariants({ variant: 'ghost', size: 'icon-xs' })]);
	}
}
