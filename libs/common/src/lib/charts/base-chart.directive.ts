import { AfterViewInit, ChangeDetectorRef, Directive, ElementRef, inject, OnDestroy, ViewChild } from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { auditTime, takeUntil } from 'rxjs/operators';
import * as d3 from 'd3';

@Directive({
  selector: '[stfBaseChart]',
  standalone: true,
})
export abstract class BaseChartDirective implements AfterViewInit, OnDestroy {
  @ViewChild('container') container: ElementRef | undefined;

  protected cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  protected unsubscribeAll = new Subject<void>();
  protected abstract draw(): void;

  defaultHeight = 336;

  ngAfterViewInit(): void {
    setTimeout(() => this.draw(), 0);

    // Make the chart responsive
    fromEvent(window, 'resize')
      .pipe(auditTime(200), takeUntil(this.unsubscribeAll))
      .subscribe(() => {
        this.removeExistingChartFromParent();
        this.draw();
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  private removeExistingChartFromParent(): void {
    d3.select(this.container?.nativeElement)
      .select('svg')
      .remove();
  }
}
