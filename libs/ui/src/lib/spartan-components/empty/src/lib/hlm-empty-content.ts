import { Directive } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
	selector: '[hlmEmptyContent],hlm-empty-content',
	host: { 'data-slot': 'empty-content' },
})
export class HlmEmptyContent {
	constructor() {
		classes(() => 'gap-2.5 text-sm flex w-full max-w-sm min-w-0 flex-col items-center text-balance');
	}
}
