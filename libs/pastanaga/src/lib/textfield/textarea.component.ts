import { ControlValueAccessor, UntypedFormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validator } from '@angular/forms';
import {
  EventEmitter,
  Input,
  OnInit,
  Output,
  Component,
  forwardRef,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { keyCodes } from '../keycodes.constant';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

let nextId = 0;

type Color = 'gray' | 'white';

@Component({
  selector: 'stf-textarea',
  templateUrl: 'textarea.component.html',
  styleUrls: ['textarea.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true,
    },
  ],
})
export class TextareaComponent implements ControlValueAccessor, OnInit, Validator, OnDestroy {
  @Input() id: string | undefined;
  @Input() name: string | undefined;
  @Input() value: string | undefined;
  @Input() label: string | undefined;
  @Input() errorHelp: string | undefined;
  @Input() errorMessage: string | undefined;
  @Input() help: string | undefined;
  @Input() color: Color = 'gray';
  
  @Input()  
  get required(): boolean { return this._required; }
  set required(value: boolean) { this._required = coerceBooleanProperty(value); }
  @Input()
  get disabled(): boolean { return this._disabled; }
  set disabled(value: boolean) { this._disabled = coerceBooleanProperty(value); }
  @Input()
  get isReadOnly(): boolean { return this._isReadOnly; }
  set isReadOnly(value: boolean) { this._isReadOnly = coerceBooleanProperty(value); }
  @Input()
  get isLabelHidden(): boolean { return this._isLabelHidden; }
  set isLabelHidden(value: boolean) { this._isLabelHidden = coerceBooleanProperty(value); }
  @Input()
  get isCode(): boolean { return this._isCode; }
  set isCode(value: boolean) { this._isCode = coerceBooleanProperty(value); }

  @Input() initialHeight: string | undefined;
  @Input() debounceTime: number = 150;

  @Output() valueChange: EventEmitter<string> = new EventEmitter();
  @Output() keyUp: EventEmitter<string> = new EventEmitter();
  @Output() blur: EventEmitter<string> = new EventEmitter();

  _required = false;
  _disabled = false;
  _isReadOnly = false;
  _isLabelHidden = false;
  _isCode = false;
  
  helpId: string | undefined;
  onChange: Function | undefined;
  onTouched: Function | undefined;
  hasError = false;
  errors: { required: boolean; } = { required: false };

  debouncer: Subject<string> = new Subject();
  @ViewChild('textarea') textarea: ElementRef | undefined;
  private unsubscribeAll = new Subject<void>()

  constructor() {}

  ngOnInit() {
    this.id = !!this.id ? `${this.id}-input` : `textarea-${nextId++}`;
    this.name = this.name || this.id;
    if (this.help) {
      this.helpId = `${this.id}-help`;
    }
    this.debouncer.pipe(
      debounceTime(this.debounceTime),
      takeUntil(this.unsubscribeAll)
    ).subscribe((value) => this.valueChange.emit(value));
  }

  ngOnDestroy(): void {
    if (this.unsubscribeAll) {
      this.unsubscribeAll.next();
      this.unsubscribeAll.complete();
    }
  }

  changeEvent($event: any) {
    const value = $event.target.value;
    this._validate(value);
    this.writeValue(value);
    if (this.onChange) {
      this.onChange(value);
    }
    if (this.onTouched) {
      this.onTouched(value);
    }
  }

  onKeyUp($event: any) {
    if ($event.keyCode !== keyCodes.tab) {
      const value = $event.target.value;
      this._validate(value);
      this.writeValue(value);
      this.keyUp.emit(value);
      if (this.onChange) {
        this.onChange(value);
      }
    }
  }

  onBlur() {
    this._validate(this.value);
    this.validate(<UntypedFormControl>{});
    this.blur.emit(this.value || '');
  }

  _validate(value: any) {
    if (this.required) {
      this.errors.required = !value;
    }
  }

  validate(control: UntypedFormControl) {
    if (!this.errors.required) {
      this.hasError = false;
      return null;
    }
    const errors: any = {};
    if (this.errors.required) {
      errors.required = { valid: false };
    }
    this.hasError = true;
    return errors;
  }

  writeValue(value: any) {
    this.value = value;
    if (this.textarea) {
      this.textarea.nativeElement.value = value;
    }
    this.debouncer.next(value);
  }

  registerOnTouched(handler: any) {
    this.onTouched = handler as Function;
  }

  registerOnChange(handler: any) {
    this.onChange = handler as Function;
  }
}
