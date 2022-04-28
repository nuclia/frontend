import { Directive, AfterViewInit, ElementRef } from '@angular/core';

@Directive({
  selector: '[stfAutoFocus]',
})
export class AutoFocusDirective implements AfterViewInit {
  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.el.nativeElement.focus();
    }, 0);
    // this.el.nativeElement.focus();
    //
  }
}
