import { Directive } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
	selector: '[hlmEmptyTitle]',
	host: { 'data-slot': 'empty-title' },
})
export class HlmEmptyTitle {
	constructor() {
		classes(() => 'text-sm font-medium tracking-tight');
	}
}
