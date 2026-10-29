import { Directive } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
	selector: '[hlmSheetHeader],hlm-sheet-header',
	host: { 'data-slot': 'sheet-header' },
})
export class HlmSheetHeader {
	constructor() {
		classes(() => 'gap-0.5 p-4 flex flex-col');
	}
}
