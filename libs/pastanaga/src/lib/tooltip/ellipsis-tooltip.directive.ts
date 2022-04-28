import { Directive, Input, AfterViewInit, OnChanges, Host, ElementRef, SimpleChanges } from '@angular/core';
import { TooltipDirective } from './tooltip.directive';

@Directive({
  selector: '[stfEllipsisTooltip]',
})
export class ExtendedTooltipDirective extends TooltipDirective {}

@Directive({
  selector: '[stfEllipsisTooltip]'
})
export class EllipsisTooltipDirective implements AfterViewInit, OnChanges {
  @Input() stfEllipsisTooltip: string | undefined;

  constructor(
    @Host() private tooltip: ExtendedTooltipDirective,
    private elementRef: ElementRef,
  ) {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.updateTooltip();
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!!changes.stfEllipsisTooltip?.currentValue && !changes.stfEllipsisTooltip.firstChange) {
      setTimeout(() => {
        this.updateTooltip();
      }, 0);
    }
  }

  hasOverflow() {
    return this.elementRef.nativeElement.offsetWidth < this.elementRef.nativeElement.scrollWidth;
  }

  updateTooltip() {
    this.tooltip.stfTooltipText = this.stfEllipsisTooltip;
    this.tooltip.stfTooltipDisabled = !this.hasOverflow();
  }
}