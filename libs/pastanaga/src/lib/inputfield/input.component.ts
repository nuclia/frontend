import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Platform } from '@angular/cdk/platform';
import { AutofillMonitor } from '@angular/cdk/text-field';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl, FormGroupDirective } from '@angular/forms';
import { Subject, forkJoin, merge } from 'rxjs';
import { takeUntil, take, tap, map } from 'rxjs/operators';
import { ErrorStateMatcher } from '../error';
import { TranslateService } from '@ngx-translate/core';

import {
  Component,
  forwardRef,
  ViewEncapsulation,
  AfterViewChecked,
  ElementRef,
  Output,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  ViewChild,
  HostBinding,
  AfterViewInit,
  Optional,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';

let nextUniqueId = 0;

export type Theme = 'gray' | 'white' | 'border';

const INVALID_TYPES = ['button', 'checkbox', 'file', 'hidden', 'image', 'radio', 'range', 'reset', 'submit'];

function getSTFInputUnsupportedTypeError(type: string): Error {
  return Error(`Input type "${type}" isn't supported by matInput.`);
}

@Component({
  selector: 'stf-input',
  templateUrl: 'input.component.html',
  styleUrls: ['input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => STFInputComponent),
      multi: true,
    },
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class STFInputComponent
  implements ControlValueAccessor, OnInit, OnChanges, OnDestroy, AfterViewChecked, AfterViewInit
{
  protected _uid = `stf-input-${nextUniqueId++}`;
  @Input() id: string = this._uid;

  @Input() ariaLabel: string | undefined;
  @Input() name: string | undefined;
  @Input() theme: Theme = 'gray';
  @Input() errorStateMatcher: ErrorStateMatcher | undefined;

  @Input()
  get value(): string {
    return this._value;
  }
  set value(value: string) {
    if (value !== this.value) {
      this._value = value;
      // this.label_float = !this.empty;
      this.label_float = value !== '';
      this.stateChanges.next();
      this.cdr?.markForCheck();
    }
  }
  private _value = '';

  @Input()
  get required(): boolean {
    return this._required;
  }
  set required(value: boolean) {
    this._required = coerceBooleanProperty(value);
  }
  protected _required = false;

  @Input()
  get noAutocapitalize(): boolean {
    return this._noAutocapitalize;
  }
  set noAutocapitalize(value: boolean) {
    this._noAutocapitalize = coerceBooleanProperty(value);
  }
  _noAutocapitalize = false;

  @Input()
  get noAutocomplete(): boolean {
    return this._noAutocomplete;
  }
  set noAutocomplete(value: boolean) {
    this._noAutocomplete = coerceBooleanProperty(value);
  }
  _noAutocomplete = false;

  @Input()
  get readonly(): boolean {
    return this._readonly;
  }
  set readonly(value: boolean) {
    this._readonly = coerceBooleanProperty(value);
  }
  _readonly = false;

  @Input()
  get isLessen(): boolean {
    return this._isLessen;
  }
  set isLessen(value: boolean) {
    this._isLessen = coerceBooleanProperty(value);
  }
  _isLessen = false;

  @Input()
  get withIcon(): boolean {
    return this._withIcon;
  }
  set withIcon(value: boolean) {
    this._withIcon = coerceBooleanProperty(value);
  }
  _withIcon = false;

  @Input()
  get noSpellcheck(): boolean {
    return this._noSpellcheck;
  }
  set noSpellcheck(value: boolean) {
    this._noSpellcheck = coerceBooleanProperty(value);
  }
  _noSpellcheck = false;

  @Input()
  get type(): string {
    return this._type;
  }
  set type(value: string) {
    this._type = value || 'text';
    this._validateType();
  }
  protected _type = 'text';

  controlType = 'stf-input';
  @Input() placeholder: string | undefined;

  @Input() help: string | undefined;

  @Input()
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);

    // Browsers may not fire the blur event if the input is disabled too quickly.
    // Reset from here to ensure that the element doesn't become stuck.
    if (this.focused) {
      this.focused = false;
      this.stateChanges.next();
    }
  }
  protected _disabled = false;

  @Input() isLabelHidden: boolean = false;
  @Input() validation_messages: any;
  @Input() validator: FormControl | undefined;

  @Output() valueChange: EventEmitter<any> = new EventEmitter();
  @Output() keyUp: EventEmitter<any> = new EventEmitter();
  @Output() keyDown: EventEmitter<any> = new EventEmitter();
  @Output() blur: EventEmitter<any> = new EventEmitter();
  @Output() enterPressed: EventEmitter<any> = new EventEmitter();
  @Output() focusOut: EventEmitter<MouseEvent> = new EventEmitter();

  @HostBinding('class') get themeClass() {
    return `stf-theme-${this.theme}`;
  }

  get empty(): boolean {
    return !this.element?.nativeElement.value && !this._isBadInput() && !this.autofilled;
  }

  @ViewChild('realInput', { static: true }) element: ElementRef | undefined;
  helpId: string | undefined;
  onChange: any;
  onTouched: any;
  errorHelp: string | undefined;

  focused = false;
  autofilled = false;
  errorState = false;
  label_float = false;

  readonly stateChanges: Subject<void> = new Subject<void>();
  private unsubscribeAll: Subject<void>;

  constructor(
    protected _platform: Platform,
    protected ngZone: NgZone,
    private _autofillMonitor: AutofillMonitor,
    public _defaultErrorStateMatcher: ErrorStateMatcher,
    private translate: TranslateService,
    @Optional() private formDirective: FormGroupDirective,
    private cdr: ChangeDetectorRef,
  ) {
    this.unsubscribeAll = new Subject();
  }

  ngOnInit() {
    if (this.validator) {
      const onSubmit$ = this.formDirective.ngSubmit.pipe(
        tap(() => {
          this.validator!.markAsTouched();
        }),
        map(() => this.validator!.status),
      );
      merge(onSubmit$, this.validator.statusChanges)
        .pipe(takeUntil(this.unsubscribeAll))
        .subscribe((status: string) => {
          if (status === 'VALID') {
            this.errorHelp = '';
          } else {
            this.updateError();
          }
          this.cdr?.markForCheck();
        });
    }

    if (this.help) {
      this.helpId = `${this.id}-help`;
    }
    if (this.value !== '' && this.value !== undefined && this.value !== null) {
      this.label_float = true;
    }
  }

  updateError() {
    if (this.validator && this.validator.errors) {
      this.errorHelp = '';

      const errors$ = Object.keys(this.validator.errors).map((key) => {
        const text = this.validation_messages[key];
        return this.translate.get(text).pipe(take(1));
      });

      forkJoin(errors$).subscribe((errors: string[]) => {
        let first = true;
        errors.forEach((error: string) => {
          if (!first) {
            this.errorHelp += '<br/>';
          }
          this.errorHelp += error;
          first = false;
        });
        this.cdr?.markForCheck();
      });
    }
  }

  ngAfterViewInit() {
    if (this._platform.isBrowser) {
      this._autofillMonitor.monitor(this.element?.nativeElement).subscribe((event) => {
        this.autofilled = event.isAutofilled;
        this.label_float = true;
        this.stateChanges.next();
        this.cdr?.markForCheck();
      });
    }
  }

  ngAfterViewChecked() {
    if (this._platform.IOS) {
      this.ngZone.runOutsideAngular(() => {
        this.element?.nativeElement.addEventListener('keyup', (event: Event) => {
          const el = event.target as HTMLInputElement;
          if (!el.value && !el.selectionStart && !el.selectionEnd) {
            // Note: Just setting `0, 0` doesn't fix the issue. Setting
            // `1, 1` fixes it for the first time that you type text and
            // then hold delete. Toggling to `1, 1` and then back to
            // `0, 0` seems to completely fix it.
            el.setSelectionRange(1, 1);
            el.setSelectionRange(0, 0);
          }
        });
      });
    }
    if (this.validator && this.disabled !== this.validator.disabled) {
      this.disabled = this.validator.disabled;
    }
  }

  ngOnChanges() {
    this.stateChanges.next();
  }

  ngOnDestroy() {
    this.stateChanges.complete();

    if (this.unsubscribeAll) {
      this.unsubscribeAll.next();
      this.unsubscribeAll.complete();
    }

    if (this._platform.isBrowser) {
      this._autofillMonitor.stopMonitoring(this.element?.nativeElement);
    }
  }

  protected _isBadInput() {
    const validity = (this.element?.nativeElement as HTMLInputElement).validity;
    return validity && validity.badInput;
  }

  change(value: any) {
    if (value === undefined || value === null) {
      value = '';
    }

    this.valueChange.emit(value);
    this.value = value;
    this.label_float = !this.empty;
    if (this.onChange) {
      this.onChange(value);
    }
    if (this.onTouched) {
      this.onTouched(value);
    }
  }

  onKeyUp(value: string) {
    this.writeValue(value);
    this.keyUp.emit(value);
    if (this.onChange) {
      this.onChange(value);
    }
  }

  onKeyDown(_value: string, event: KeyboardEvent) {
    this.keyDown.emit(event);
  }

  onEnterPressed(event: KeyboardEvent) {
    event.preventDefault();
    this.enterPressed.emit(event);
  }

  writeValue(value: any) {
    this.value = value;
  }

  registerOnTouched(handler: any) {
    this.onTouched = handler;
  }

  registerOnChange(handler: any) {
    this.onChange = handler;
  }

  setDisabledState(isDisabled: boolean) {
    this._disabled = isDisabled;
    this.cdr?.markForCheck();
  }

  _focusChanged(isFocused: boolean) {
    if (isFocused) {
      this.label_float = true;
    } else {
      this.blur.emit(this._value);
      if (this.empty) {
        this.label_float = false;
      }
    }
    if (isFocused !== this.focused && !this.readonly) {
      this.focused = isFocused;
      this.stateChanges.next();
    }
  }

  protected _validateType() {
    if (INVALID_TYPES.indexOf(this._type) > -1) {
      throw getSTFInputUnsupportedTypeError(this._type);
    }
  }
}
