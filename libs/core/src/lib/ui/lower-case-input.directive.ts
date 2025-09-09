import { Directive, inject, OnDestroy, OnInit } from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

@Directive({
  selector: '[stfLowerCaseInput]',
  standalone: true,
})
export class LowerCaseInputDirective implements OnInit, OnDestroy {
  private control = inject(NgControl);
  private unsubscribeAll = new Subject<void>();

  ngOnInit(): void {
    this.control.valueChanges?.pipe(takeUntil(this.unsubscribeAll)).subscribe((value) => {
      if (typeof value === 'string' && value !== value.toLowerCase()) {
        this.control.control?.setValue(value.toLowerCase());
      }
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
