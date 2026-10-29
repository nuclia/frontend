import { Directive } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
	selector: '[hlmSidebarFooter],hlm-sidebar-footer',
	host: {
		'data-slot': 'sidebar-footer',
		'data-sidebar': 'footer',
	},
})
export class HlmSidebarFooter {
	constructor() {
		classes(() => 'gap-2 p-2 flex flex-col');
	}
}
