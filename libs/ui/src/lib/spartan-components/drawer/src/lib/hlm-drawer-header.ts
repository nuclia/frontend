import { Directive } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
	selector: '[hlmDrawerHeader],hlm-drawer-header',
	host: { 'data-slot': 'drawer-header' },
})
export class HlmDrawerHeader {
	constructor() {
		classes(() => 'gap-0.5 p-4 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-0.5 md:text-start flex flex-col');
	}
}
