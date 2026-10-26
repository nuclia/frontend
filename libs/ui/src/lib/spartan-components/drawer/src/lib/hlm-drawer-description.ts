import { Directive } from '@angular/core';
import { BrnDrawerDescription } from '@spartan-ng/brain/drawer';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
	selector: '[hlmDrawerDescription]',
	hostDirectives: [BrnDrawerDescription],
	host: { 'data-slot': 'drawer-description' },
})
export class HlmDrawerDescription {
	constructor() {
		classes(() => 'text-muted-foreground text-sm');
	}
}
