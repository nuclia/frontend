import { Directive } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
	selector: '[hlmCommandGroupLabel],hlm-command-group-label',
	host: {
		'data-slot': 'command-group-label',
		role: 'presentation',
	},
})
export class HlmCommandGroupLabel {
	constructor() {
		classes(() => 'inline-block');
	}
}
