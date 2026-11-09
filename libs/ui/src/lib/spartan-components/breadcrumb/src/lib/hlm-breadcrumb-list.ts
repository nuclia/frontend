import { Directive } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
  selector: '[hlmBreadcrumbList]',
  exportAs: 'hlmBreadcrumbList',
  host: {
    'data-slot': 'breadcrumb-list',
  },
})
export class HlmBreadcrumbList {
  constructor() {
    classes(() => 'text-muted-foreground gap-1.5 text-sm flex flex-wrap items-center wrap-break-word');
  }
}
