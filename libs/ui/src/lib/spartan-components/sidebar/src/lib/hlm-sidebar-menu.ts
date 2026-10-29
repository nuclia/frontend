import { Directive } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
	selector: 'ul[hlmSidebarMenu]',
	host: {
		'data-slot': 'sidebar-menu',
		'data-sidebar': 'menu',
	},
})
export class HlmSidebarMenu {
	constructor() {
		classes(() => 'gap-0 flex w-full min-w-0 flex-col');
	}
}
