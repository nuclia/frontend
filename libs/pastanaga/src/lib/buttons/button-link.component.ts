import { Component, EventEmitter, Input, OnChanges, Output, ViewEncapsulation, SimpleChanges } from '@angular/core';
import { ButtonBase } from './button-base';

@Component({
  selector: 'stf-button-link',
  templateUrl: './button-link.component.html',
  styleUrls: ['./button.component.scss'],
  encapsulation: ViewEncapsulation.None, // to allow button style to access icon svg
})
export class STFButtonLinkComponent extends ButtonBase implements OnChanges {
  @Input() route?: string;
  @Input() hasButtonDisplay = false;

  // tslint:disable-next-line:no-output-on-prefix
  @Output() onClick: EventEmitter<any> = new EventEmitter();

  ngOnChanges(changes: SimpleChanges) {
    this.onChanges(changes);

    if (changes.hasButtonDisplay) {
      this.buttonStyle['stf-button-link'] = changes.hasButtonDisplay.currentValue;
    }
  }
}
