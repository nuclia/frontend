import { Directive, input } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const bubbleVariants = cva(
	'max-w-[80%] gap-1 group/bubble relative flex w-fit min-w-0 flex-col group-data-[align=end]/message:self-end data-[align=end]:self-end data-[variant=ghost]:max-w-full',
	{
		variants: {
			variant: {
				default: '*:data-[slot=bubble-content]:bg-primary *:data-[slot=bubble-content]:text-primary-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:bg-primary/80',
				secondary: '*:data-[slot=bubble-content]:bg-secondary *:data-[slot=bubble-content]:text-secondary-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:bg-secondary/80',
				muted: '*:data-[slot=bubble-content]:bg-muted [&>[data-slot=bubble-content]:is(button,a):hover]:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_5%)]',
				tinted: '*:data-[slot=bubble-content]:text-foreground *:data-[slot=bubble-content]:bg-[oklch(from_var(--primary)_0.93_calc(c*0.4)_h)] dark:*:data-[slot=bubble-content]:bg-[oklch(from_var(--primary)_0.3_calc(c*0.4)_h)] [&>[data-slot=bubble-content]:is(button,a):hover]:bg-[oklch(from_var(--primary)_0.88_calc(c*0.5)_h)] dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-[oklch(from_var(--primary)_0.35_calc(c*0.5)_h)]',
				outline: '*:data-[slot=bubble-content]:border-border *:data-[slot=bubble-content]:bg-background [&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted [&>[data-slot=bubble-content]:is(button,a):hover]:text-foreground dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-input/30 *:data-[slot=bubble-content]:border',
				ghost: '[&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted [&>[data-slot=bubble-content]:is(button,a):hover]:text-foreground dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted/50 border-none *:data-[slot=bubble-content]:rounded-none *:data-[slot=bubble-content]:bg-transparent *:data-[slot=bubble-content]:p-0',
				destructive: '*:data-[slot=bubble-content]:bg-destructive/10 *:data-[slot=bubble-content]:text-destructive dark:*:data-[slot=bubble-content]:bg-destructive/20 [&>[data-slot=bubble-content]:is(button,a):hover]:bg-destructive/20 dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-destructive/30',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
);

export type BubbleVariants = VariantProps<typeof bubbleVariants>;
export type BubbleAlign = 'start' | 'end';

@Directive({
	selector: '[hlmBubble],hlm-bubble',
	host: {
		'data-slot': 'bubble',
		'[attr.data-variant]': 'variant()',
		'[attr.data-align]': 'align()',
		// Prevent the legacy HTML `align` attribute (from `align="end"` bindings) from
		// forcing text-align on the bubble content.
		'[attr.align]': 'null',
	},
})
export class HlmBubble {
	public readonly variant = input<BubbleVariants['variant']>('default');
	public readonly align = input<BubbleAlign>('start');

	constructor() {
		classes(() => bubbleVariants({ variant: this.variant() }));
	}
}
