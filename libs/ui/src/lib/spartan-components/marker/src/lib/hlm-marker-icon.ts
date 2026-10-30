import { Directive } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
  selector: '[hlmMarkerIcon],hlm-marker-icon',
  host: {
    'data-slot': 'marker-icon',
    'aria-hidden': 'true',
  },
})
export class HlmMarkerIcon {
  constructor() {
    classes(() => "size-4 shrink-0 [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(4)]");
  }
}
