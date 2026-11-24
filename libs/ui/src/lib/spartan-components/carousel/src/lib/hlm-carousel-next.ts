// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  untracked,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matArrowForwardRound } from '@ng-icons/material-symbols/round';
import {
  HlmButton,
  provideBrnButtonConfig,
} from '@progress/pdp-ui-spartan/button';
import { hlm } from '@progress/pdp-ui-spartan/utils';
import { HlmCarousel } from './hlm-carousel';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- Intentionally targets a native button.
  selector: 'button[hlm-carousel-next], button[hlmCarouselNext]',
  exportAs: 'hlmCarouselNext',
  imports: [NgIcon],
  providers: [
    provideIcons({ matArrowForwardRound }),
    provideBrnButtonConfig({ variant: 'outline', size: 'icon-sm' }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: HlmButton, inputs: ['variant', 'size'] }],
  host: {
    'data-slot': 'carousel-next',
    '[disabled]': 'isDisabled()',
    '(click)': '_carousel.scrollNext()',
  },
  template: `
    <ng-icon name="matArrowForwardRound" class="rtl:rotate-180" />
    <span class="sr-only">Next slide</span>
  `,
})
export class HlmCarouselNext {
  private readonly _button = inject(HlmButton);
  protected readonly _carousel = inject(HlmCarousel);
  private readonly _computedClass = computed(() =>
    hlm(
      'rounded-full absolute h-8 w-8',
      this._carousel.orientation() === 'horizontal'
        ? '-end-12 top-1/2 -translate-y-1/2'
        : '-bottom-12 left-1/2 -translate-x-1/2 rotate-90',
    ),
  );
  protected readonly isDisabled = () => !this._carousel.canScrollNext();

  constructor() {
    effect(() => {
      const computedClass = this._computedClass();

      untracked(() => this._button.setClass(computedClass));
    });
  }
}
