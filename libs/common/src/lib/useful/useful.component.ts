import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Component, Input, OnInit } from '@angular/core';
import { STFTrackingService } from '@flaps/core';

@Component({
  selector: 'stf-useful',
  templateUrl: './useful.component.html',
  styleUrls: ['./useful.component.scss'],
})
export class STFUsefulComponent implements OnInit {
  @Input() content: string | null = null;
  @Input()
  get renderText(): boolean {
    return this._renderText;
  }
  set renderText(value: boolean) {
    this._renderText = coerceBooleanProperty(value);
  }

  protected _renderText: boolean = true;
  answered = false;

  constructor(private tracking: STFTrackingService) {}

  ngOnInit() {}

  useful() {
    if (this.content == null && window) {
      this.tracking.successResult(window.location.href, 'success', undefined);
    }
    if (this.content) {
      this.tracking.successResult(window.location.href, 'success', this.content);
    }
    this.answered = true;
  }

  notUseful() {
    if (this.content == null && window) {
      this.tracking.successResult(window.location.href, 'fail', undefined);
    }
    if (this.content) {
      this.tracking.successResult(window.location.href, 'fail', this.content);
    }
    this.answered = true;
  }
}
