import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { AfterViewInit, Directive, EventEmitter, inject, Output } from '@angular/core';

@Directive({
  selector: 'cdk-virtual-scroll-viewport[tableVirtualScroll]',
})
export class TableVirtualScrollDirective implements AfterViewInit {
  viewport = inject(CdkVirtualScrollViewport, { host: true });

  @Output() offsetChange = new EventEmitter<number>();

  ngAfterViewInit() {
    if (this.viewport) {
      this.viewport['_scrollStrategy'].onRenderedOffsetChanged = () => {
        this.offsetChange.emit(this.viewport?.getOffsetToRenderedContentStart() || 0);
      };
    }
  }
}
