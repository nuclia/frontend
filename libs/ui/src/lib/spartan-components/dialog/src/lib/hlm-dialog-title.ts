import { Directive } from '@angular/core';
import { BrnDialogTitle } from '@spartan-ng/brain/dialog';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
	selector: '[hlmDialogTitle]',
	hostDirectives: [BrnDialogTitle],
	host: { 'data-slot': 'dialog-title' },
})
export class HlmDialogTitle {
	constructor() {
		classes(() => 'text-base leading-none font-medium');
	}
}
