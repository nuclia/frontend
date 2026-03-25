import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  HostBinding,
  inject,
  input,
} from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { IErrorMessages, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { COUNTRIES } from './countries';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'nsi-country-select',
  imports: [PaTextFieldModule, ReactiveFormsModule],
  templateUrl: './country-select.component.html',
  styleUrl: './country-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CountrySelectComponent),
      multi: true,
    },
  ],
})
export class CountrySelectComponent implements ControlValueAccessor {
  private cdr = inject(ChangeDetectorRef);

  // ── Inputs (signal-based) ──────────────────────────────────────────
  readonly id = input<string>('');
  readonly readonly = input(false);
  readonly errorMessages = input<IErrorMessages>({} as IErrorMessages);
  readonly externalLabel = input(false);

  // Remove id from host — the inner pa-typeahead-select carries it
  // so that <label for="X"> correctly targets the focusable input.
  @HostBinding('attr.id') get hostId() {
    return null;
  }

  // ── Internal form control for pa-typeahead-select ──────────────────
  protected innerControl = new FormControl('');

  // ── Country list with emoji flags ──────────────────────────────────
  countryList = Object.entries(COUNTRIES)
    .map(([code, name]) => ({ code, name, flag: this.countryCodeToFlag(code) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // ── CVA callbacks ──────────────────────────────────────────────────
  private onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  constructor() {
    this.innerControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      this.onChange(value || '');
    });
  }

  // ── ControlValueAccessor implementation ────────────────────────────
  writeValue(value: string): void {
    this.innerControl.setValue(value || '', { emitEvent: false });
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.innerControl.disable({ emitEvent: false });
    } else {
      this.innerControl.enable({ emitEvent: false });
    }
    this.cdr.markForCheck();
  }

  private countryCodeToFlag(code: string): string {
    return code
      .toUpperCase()
      .split('')
      .map((char) => String.fromCodePoint(char.charCodeAt(0) + 127397))
      .join('');
  }
}
