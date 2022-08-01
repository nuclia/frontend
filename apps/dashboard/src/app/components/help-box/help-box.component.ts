import { Component, Input, OnInit, ElementRef, Inject, Renderer2, HostBinding } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { takeUntil } from 'rxjs/operators';
import { TourService, IStepOption } from 'ngx-ui-tour-md-menu';
import { STFTrackingService } from '@flaps/core';

@Component({
  selector: 'app-help-box',
  templateUrl: './help-box.component.html',
  styleUrls: ['./help-box.component.scss'],
})
export class HelpBoxComponent implements OnInit {
  @Input() step: IStepOption | undefined;

  @HostBinding('style.transform') get offset() {
    return 'translate(' + this.offsetX() + ',' + this.offsetY() + ')';
  }

  constructor(
    private tourService: TourService,
    private elementRef: ElementRef,
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private tracking: STFTrackingService,
  ) {}

  ngOnInit(): void {
    this.tourService.stepShow$.pipe(takeUntil(this.tourService.end$)).subscribe(() => {
      setTimeout(() => {
        this.fixPointers();
      }, 300); // Wait until the overlay is created
    });
  }

  dismiss(): void {
    this.tracking.logEvent('tour_dismissed');
    this.tourService.end();
  }

  next(): void {
    this.tracking.logEvent('tour_step_done', { step: this.tourService.currentStep.anchorId || '' });
    this.tourService.next();
  }

  hasNext(): boolean {
    return !!this.step && this.tourService.hasNext(this.step);
  }

  current(): number {
    return this.tourService.steps.indexOf(this.step!) + 1;
  }

  total(): number {
    return this.tourService.steps.length;
  }

  offsetX(): string | undefined {
    return this.step?.stepId?.split(',')[0];
  }

  offsetY(): string | undefined {
    return this.step?.stepId?.split(',')[1];
  }

  arrowClass(): string {
    const position = this.step?.stepId?.split(',')[2];
    return position ? 'arrow-' + position : '';
  }

  fixPointers() {
    // Fix pointer events. It's needed when offsetX/Y are not 0
    const overlay = document.querySelector('.tour-step.mat-menu-panel')?.parentElement;
    if (overlay) {
      this.renderer.setStyle(overlay, 'pointer-events', 'none');
      this.renderer.setStyle(this.elementRef.nativeElement, 'pointer-events', 'auto');
    }
  }
}
