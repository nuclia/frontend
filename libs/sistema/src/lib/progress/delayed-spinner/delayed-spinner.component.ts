import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Size } from '@guillotinaweb/pastanaga-angular';
import { coerceNumberProperty } from '@angular/cdk/coercion';

@Component({
  selector: 'nsi-delayed-spinner',
  templateUrl: './delayed-spinner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DelayedSpinnerComponent implements OnInit {
  @Input()
  set size(value: Size | undefined) {
    if (value) {
      this._size = value;
    }
  }
  get size() {
    return this._size;
  }

  @Input()
  set delay(value: any) {
    this._delay = coerceNumberProperty(value);
  }
  get delay() {
    return this._delay;
  }

  display = false;

  private _size: Size = 'medium';
  private _delay = 1500;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.display = true;
      this.cdr.markForCheck();
    }, this.delay);
  }
}
