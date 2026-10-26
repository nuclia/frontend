import { Directive } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
	selector: 'ul[hlmPaginationContent]',
	host: { 'data-slot': 'pagination-content' },
})
export class HlmPaginationContent {
	constructor() {
		classes(() => 'gap-0.5 flex items-center');
	}
}
