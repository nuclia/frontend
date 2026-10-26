import { Directive, input } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const bubbleReactionsVariants = cva(
	'bg-muted ring-card gap-1 rounded-full px-1.5 py-0.5 text-xs ring-3 absolute z-10 flex w-fit shrink-0 items-center justify-center has-[button]:p-0',
	{
		variants: {
			side: {
				top: 'top-0 -translate-y-3/4',
				bottom: 'bottom-0 translate-y-3/4',
			},
			align: {
				start: 'start-3',
				end: 'end-3',
			},
		},
		defaultVariants: {
			side: 'bottom',
			align: 'end',
		},
	},
);

export type BubbleReactionsVariants = VariantProps<typeof bubbleReactionsVariants>;

@Directive({
	selector: '[hlmBubbleReactions],hlm-bubble-reactions',
	host: {
		'data-slot': 'bubble-reactions',
		'[attr.data-align]': 'align()',
		'[attr.data-side]': 'side()',
		'[attr.align]': 'null',
	},
})
export class HlmBubbleReactions {
	public readonly side = input<BubbleReactionsVariants['side']>('bottom');
	public readonly align = input<BubbleReactionsVariants['align']>('end');

	constructor() {
		classes(() => bubbleReactionsVariants({ side: this.side(), align: this.align() }));
	}
}
