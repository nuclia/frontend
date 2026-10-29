import { Directive } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
	selector: '[hlmCardFooter],hlm-card-footer',
	host: { 'data-slot': 'card-footer' },
})
export class HlmCardFooter {
	constructor() {
		classes(() => 'bg-muted/50 rounded-b-xl border-t p-(--card-spacing) flex items-center');
	}
}
