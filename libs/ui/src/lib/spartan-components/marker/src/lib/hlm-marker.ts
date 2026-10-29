import { Directive, input } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const markerVariants = cva(
  "text-muted-foreground gap-2 group/marker [a]:hover:text-foreground relative flex min-h-4 w-full items-center text-start text-sm [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(4)] [a]:underline [a]:underline-offset-3",
  {
    variants: {
      variant: {
        default: '',
        separator:
          'before:bg-border after:bg-border before:me-1 before:h-px before:min-w-0 before:flex-1 after:ms-1 after:h-px after:min-w-0 after:flex-1',
        border: 'border-border border-b pb-2',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export type MarkerVariants = VariantProps<typeof markerVariants>;

@Directive({
  selector: '[hlmMarker],hlm-marker',
  host: {
    'data-slot': 'marker',
    '[attr.data-variant]': 'variant()',
  },
})
export class HlmMarker {
  public readonly variant = input<MarkerVariants['variant']>('default');

  constructor() {
    classes(() => markerVariants({ variant: this.variant() }));
  }
}
