// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive, input } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const codeBlockVariants = cva(
  'has-[>[data-slot=code-block-content]:focus-visible]:ring-ring/50 rounded-lg text-sm has-[>[data-slot=code-block-content]:focus-visible]:ring-3 data-[size=sm]:text-xs group/code-block relative flex w-full min-w-0 flex-col overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-input text-foreground dark:bg-input/30 has-[>[data-slot=code-block-content]:focus-visible]:border-ring border',
        destructive:
          'border-destructive/30 text-destructive dark:border-destructive/40 border',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

type CodeBlockVariants = VariantProps<typeof codeBlockVariants>;

@Directive({
  selector: '[hlmCodeBlock],hlm-code-block',
  exportAs: 'hlmCodeBlock',
  host: {
    'data-slot': 'code-block',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
  },
})
export class HlmCodeBlock {
  public readonly variant = input<CodeBlockVariants['variant']>('default');
  public readonly size = input<'default' | 'sm'>('default');

  constructor() {
    classes(() => codeBlockVariants({ variant: this.variant() }));
  }
}
