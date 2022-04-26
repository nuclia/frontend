import { Component, Input, Output, OnInit, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { ControlContainer, FormGroupDirective, FormControl } from '@angular/forms';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { STFInputComponent, Theme } from '../input.component';

@Component({
  selector: 'stf-password-input',
  templateUrl: './password-input.component.html',
  styleUrls: ['./password-input.component.scss'],
  viewProviders: [
    {
      provide: ControlContainer,
      useExisting: FormGroupDirective,
    },
  ],
})
export class STFPasswordInputComponent implements OnInit {
  @Input() controlName: string | undefined;
  @Input() name: string | undefined;
  @Input() validation_messages: object | undefined;
  @Input() validator: FormControl | undefined;
  @Input() theme: Theme = 'gray';

  @Input()
  get required(): boolean {
    return this._required;
  }
  set required(value: boolean) {
    this._required = coerceBooleanProperty(value);
  }
  _required = false;

  @Output() enterPressed: EventEmitter<KeyboardEvent> = new EventEmitter();
  @Output() focusOut: EventEmitter<MouseEvent> = new EventEmitter();

  passwordVisible: boolean = false;
  @ViewChild('input', { static: false }) input: STFInputComponent | undefined;

  constructor() {}

  ngOnInit(): void {}

  focus() {
    this.input?.element?.nativeElement.focus();
  }
}
