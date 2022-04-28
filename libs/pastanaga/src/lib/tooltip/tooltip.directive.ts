import { Directive, AfterViewInit, OnDestroy, Input, HostListener, ComponentRef, ElementRef } from '@angular/core';
import { Overlay, OverlayRef, OverlayPositionBuilder } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { TooltipComponent } from './tooltip.component';

@Directive({
  selector: '[stfTooltip]'
})
export class TooltipDirective implements AfterViewInit, OnDestroy {

  @Input() stfTooltipText: string | undefined;
  @Input() stfTooltipMaxWidth: string | undefined;
  @Input() stfTooltipDisabled: boolean = false;

  overlayRef: OverlayRef | undefined;

  constructor(
    private elementRef: ElementRef,
    private overlay: Overlay,
    private overlayPositionBuilder: OverlayPositionBuilder
  ) { }

  ngAfterViewInit() {
    setTimeout(() => {
      const position = this.overlayPositionBuilder
      .flexibleConnectedTo(this.elementRef)
      .withPositions([{
        originX: 'center',
        originY: 'bottom',
        overlayX: 'center',
        overlayY: 'top',
      }]);

      this.overlayRef = this.overlay.create({ 
        positionStrategy: position,
      });
    }, 300)
  }

  @HostListener('mouseenter')
  show() {
    if (this.stfTooltipDisabled || !this.overlayRef) return;

    const tooltipPortal = new ComponentPortal(TooltipComponent);
    const tooltipRef: ComponentRef<TooltipComponent> = this.overlayRef.attach(tooltipPortal);

    if (this.stfTooltipText) {
      tooltipRef.instance.text = this.stfTooltipText;
    }
    tooltipRef.instance.maxWidth = this.stfTooltipMaxWidth;
  }

  @HostListener('mouseleave')
  hide() {
    this.overlayRef?.detach();
  }

  ngOnDestroy() {
    this.overlayRef?.dispose();
  }
}