import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown } from '@ng-icons/lucide';
import { BrnNavigationMenuTrigger } from '@spartan-ng/brain/navigation-menu';
import { classes } from '@nuclia/ui-spartan/utils';

@Component({
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: 'button[hlmNavigationMenuTrigger]',
	imports: [NgIcon],
	providers: [provideIcons({ lucideChevronDown })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	hostDirectives: [{ directive: BrnNavigationMenuTrigger, inputs: ['align'] }],
	host: { 'data-slot': 'navigation-menu-trigger' },
	template: `
		<ng-content />
		<ng-icon name="lucideChevronDown" class="relative top-px ml-1 size-3 transition duration-300 group-data-open/navigation-menu-trigger:rotate-180" />
	`,
})
export class HlmNavigationMenuTrigger {
	constructor() {
		classes(
			() =>
				'bg-background hover:bg-muted focus:bg-muted data-open:hover:bg-muted data-open:focus:bg-muted data-open:bg-muted/50 focus-visible:ring-ring/50 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all focus-visible:ring-3 focus-visible:outline-1 disabled:opacity-50 group/navigation-menu-trigger inline-flex h-9 w-max items-center justify-center outline-none disabled:pointer-events-none',
		);
	}
}
