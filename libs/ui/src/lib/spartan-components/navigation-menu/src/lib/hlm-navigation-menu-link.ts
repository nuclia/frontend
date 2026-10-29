import { Directive } from '@angular/core';
import { BrnNavigationMenuLink } from '@spartan-ng/brain/navigation-menu';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
	selector: 'a[hlmNavigationMenuLink]',
	hostDirectives: [{ directive: BrnNavigationMenuLink, inputs: ['active'] }],
	host: {
		'data-slot': 'navigation-menu-link',
	},
})
export class HlmNavigationMenuLink {
	constructor() {
		classes(() => "data-active:focus:bg-muted data-active:hover:bg-muted data-active:bg-muted/50 focus-visible:ring-ring/50 hover:bg-muted focus:bg-muted flex items-center gap-2 rounded-lg p-2 text-sm transition-all outline-none focus-visible:ring-3 focus-visible:outline-1 in-data-[slot=navigation-menu-content]:rounded-md [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(4)]");
	}
}
