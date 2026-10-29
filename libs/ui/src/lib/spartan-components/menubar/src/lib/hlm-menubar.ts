import { CdkMenuBar } from '@angular/cdk/menu';
import { Directive } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
	selector: '[hlmMenubar],hlm-menubar',
	hostDirectives: [CdkMenuBar],
	host: {
		'data-slot': 'menubar',
	},
})
export class HlmMenubar {
	constructor() {
		classes(() => 'bg-background h-8 gap-0.5 rounded-lg border p-[3px] flex items-center');
	}
}
