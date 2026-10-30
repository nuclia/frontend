import { type NumberInput } from '@angular/cdk/coercion';
import { Directive, input, numberAttribute } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
  selector: '[hlmNavigationMenuContent],hlm-navigation-menu-content',
  host: {
    'data-slot': 'navigation-menu-content',
    '[style.--nav-offset]': 'navOffset()',
  },
})
export class HlmNavigationMenuContent {
  public readonly navOffset = input<number, NumberInput>(1.5, { transform: numberAttribute });

  constructor() {
    classes(() => [
      'data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out top-0 left-0 w-full p-2 pr-2.5 md:w-auto',
      'data-[orientation=horizontal]:data-[motion=from-end]:slide-in-from-right-52 data-[orientation=horizontal]:data-[motion=from-start]:slide-in-from-left-52 data-[orientation=horizontal]:data-[motion=to-end]:slide-out-to-right-52 data-[orientation=horizontal]:data-[motion=to-start]:slide-out-to-left-52',
      'data-[orientation=vertical]:data-[motion=from-end]:slide-in-from-bottom-52 data-[orientation=vertical]:data-[motion=from-start]:slide-in-from-top-52 data-[orientation=vertical]:data-[motion=to-end]:slide-out-to-bottom-52 data-[orientation=vertical]:data-[motion=to-start]:slide-out-to-top-52',
      'data-[orientation=horizontal]:mt-[--spacing(var(--nav-offset))] data-[orientation=vertical]:mx-[--spacing(var(--nav-offset))]',
      'bg-popover text-popover-foreground ring-foreground/10 rounded-lg shadow ring-1 transition-all ease-[cubic-bezier(0.22,1,0.36,1)] outline-none data-ending-style:scale-90 data-ending-style:opacity-0 data-ending-style:duration-150 data-starting-style:scale-90 data-starting-style:opacity-0 block',
    ]);
  }
}
