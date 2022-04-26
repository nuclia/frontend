import { Component, Input, OnChanges, OnInit, ViewEncapsulation, SimpleChanges, HostBinding } from '@angular/core';
import { ButtonBase } from './button-base';

let nextId = 0;

@Component({
  selector: 'stf-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  encapsulation: ViewEncapsulation.None, // to allow button style to access icon svg
})
export class STFButtonComponent extends ButtonBase implements OnInit, OnChanges {
  @Input() id: string | undefined;
  @Input() form: string | undefined;
  @Input() minWidth: string | undefined;
  checkedType = 'button';
  
  @HostBinding('class.full-width') @Input() fullWidth: boolean = false;

  ngOnInit() {
    this.id = !this.id ? `button-${nextId++}` : `${this.id}-button`;
  }

  ngOnChanges(changes: SimpleChanges) {
    this.onChanges(changes);

    if (changes.type && ['button', 'submit', 'reset'].indexOf(changes.type.currentValue) !== -1) {
      this.checkedType = this.type;
    }
  }

  onClick($event: MouseEvent) {
    if (this.type !== 'submit') {
      $event.preventDefault();
    }
  }
}
