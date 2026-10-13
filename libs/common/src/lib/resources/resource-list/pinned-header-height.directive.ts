import { Directive, ElementRef, inject, OnDestroy, OnInit } from '@angular/core';

/**
 * Exposes the height of the pinned list header as `--resource-list-header-height` on the parent element,
 * so the table header can pin right below it, whatever the number of wrapped filter rows.
 */
@Directive({
  selector: '[stfPinnedHeaderHeight]',
})
export class PinnedHeaderHeightDirective implements OnInit, OnDestroy {
  private element: HTMLElement = inject(ElementRef).nativeElement;
  private observer = new ResizeObserver(() => this.update());

  ngOnInit() {
    this.observer.observe(this.element);
  }

  ngOnDestroy() {
    this.observer.disconnect();
    this.element.parentElement?.style.removeProperty('--resource-list-header-height');
  }

  private update() {
    this.element.parentElement?.style.setProperty('--resource-list-header-height', `${this.element.offsetHeight}px`);
  }
}
