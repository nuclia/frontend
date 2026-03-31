import { ChangeDetectionStrategy, Component, ElementRef, output, signal, viewChildren } from '@angular/core';

@Component({
  selector: 'app-otp-input',
  templateUrl: './otp-input.component.html',
  styleUrl: './otp-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OtpInputComponent {
  otpComplete = output<string>();
  otpChange = output<string>();

  digits = signal<string[]>(['', '', '', '', '', '']);

  private otpInputs = viewChildren<ElementRef<HTMLInputElement>>('otpDigit');

  onInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/\D/g, '');
    const digit = raw.slice(-1);
    input.value = digit;
    const d = [...this.digits()];
    d[index] = digit;
    this.digits.set(d);

    if (digit && index < 5) {
      this.otpInputs()[index + 1]?.nativeElement.focus();
    }
    this.emit();
  }

  onKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      const input = event.target as HTMLInputElement;
      if (!input.value && index > 0) {
        event.preventDefault();
        const prevInput = this.otpInputs()[index - 1]?.nativeElement;
        if (prevInput) {
          prevInput.value = '';
          const d = [...this.digits()];
          d[index - 1] = '';
          this.digits.set(d);
          prevInput.focus();
        }
      } else {
        const d = [...this.digits()];
        d[index] = '';
        this.digits.set(d);
      }
      this.emit();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const paste = event.clipboardData?.getData('text') ?? '';
    const pasteDigits = paste.replace(/\D/g, '').split('').slice(0, 6);
    const inputs = this.otpInputs();

    const newArr: string[] = ['', '', '', '', '', ''];
    inputs.forEach((ref) => (ref.nativeElement.value = ''));

    pasteDigits.forEach((digit, i) => {
      newArr[i] = digit;
      if (inputs[i]) {
        inputs[i].nativeElement.value = digit;
      }
    });
    this.digits.set(newArr);

    const nextIndex = Math.min(pasteDigits.length, 5);
    inputs[nextIndex]?.nativeElement.focus();
    this.emit();
  }

  reset(): void {
    this.digits.set(['', '', '', '', '', '']);
    const inputs = this.otpInputs();
    inputs.forEach((ref) => (ref.nativeElement.value = ''));
    inputs[0]?.nativeElement.focus();
  }

  private get currentValue(): string {
    return this.digits().join('');
  }

  private emit(): void {
    const value = this.currentValue;
    this.otpChange.emit(value);
    if (value.length === 6) {
      this.otpComplete.emit(value);
    }
  }
}
