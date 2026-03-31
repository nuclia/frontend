import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OtpInputComponent } from './otp-input.component';

describe('OtpInputComponent', () => {
  let component: OtpInputComponent;
  let fixture: ComponentFixture<OtpInputComponent>;
  let inputs: NodeListOf<HTMLInputElement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtpInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OtpInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    inputs = fixture.nativeElement.querySelectorAll('input');
  });

  // ─── Rendering ──────────────────────────────────────────────────────────────

  it('renders 6 input elements', () => {
    expect(inputs.length).toBe(6);
  });

  // ─── onInput ────────────────────────────────────────────────────────────────

  describe('onInput()', () => {
    it('typing a digit in box 0 sets digits[0] and emits otpChange', () => {
      const otpChangeSpy = jest.fn();
      component.otpChange.subscribe(otpChangeSpy);

      inputs[0].value = '1';
      inputs[0].dispatchEvent(new InputEvent('input', { bubbles: true }));
      fixture.detectChanges();

      expect(component.digits()[0]).toBe('1');
      expect(otpChangeSpy).toHaveBeenCalledWith('1');
    });

    it('typing a digit in the last box (index 5) does not advance focus beyond array', () => {
      const otpChangeSpy = jest.fn();
      component.otpChange.subscribe(otpChangeSpy);

      // Fill first 5 to be safe
      ['1', '2', '3', '4', '5'].forEach((val, i) => {
        component.digits.update((d) => { const c = [...d]; c[i] = val; return c; });
        inputs[i].value = val;
      });

      inputs[5].value = '6';
      // Should not throw — no index 6 in the array
      expect(() => {
        inputs[5].dispatchEvent(new InputEvent('input', { bubbles: true }));
        fixture.detectChanges();
      }).not.toThrow();
      expect(component.digits()[5]).toBe('6');
    });
  });

  // ─── onPaste ────────────────────────────────────────────────────────────────

  describe('onPaste()', () => {
    function paste(text: string): void {
      // ClipboardEvent is not available in jsdom — call onPaste directly with a mock.
      const mockEvent = {
        preventDefault: jest.fn(),
        clipboardData: { getData: jest.fn().mockReturnValue(text) },
      } as unknown as ClipboardEvent;
      component.onPaste(mockEvent);
      fixture.detectChanges();
    }

    it('pasting 6 digits fills all boxes and emits otpComplete', () => {
      const otpCompleteSpy = jest.fn();
      component.otpComplete.subscribe(otpCompleteSpy);

      paste('123456');

      expect(component.digits()).toEqual(['1', '2', '3', '4', '5', '6']);
      expect(otpCompleteSpy).toHaveBeenCalledWith('123456');
    });

    it('pasting 3 digits fills first 3 boxes, does not emit otpComplete, emits otpChange', () => {
      const otpCompleteSpy = jest.fn();
      const otpChangeSpy = jest.fn();
      component.otpComplete.subscribe(otpCompleteSpy);
      component.otpChange.subscribe(otpChangeSpy);

      paste('123');

      expect(component.digits()[0]).toBe('1');
      expect(component.digits()[1]).toBe('2');
      expect(component.digits()[2]).toBe('3');
      expect(otpCompleteSpy).not.toHaveBeenCalled();
      expect(otpChangeSpy).toHaveBeenCalledWith('123');
    });

    it('pasting non-digit characters extracts only the digits', () => {
      const otpChangeSpy = jest.fn();
      component.otpChange.subscribe(otpChangeSpy);

      paste('abc123');

      expect(component.digits()[0]).toBe('1');
      expect(component.digits()[1]).toBe('2');
      expect(component.digits()[2]).toBe('3');
      expect(otpChangeSpy).toHaveBeenCalledWith('123');
    });

    it('clears stale trailing digits and does not emit otpComplete after a short paste', () => {
      const otpCompleteSpy = jest.fn();
      const otpChangeSpy = jest.fn();
      component.otpComplete.subscribe(otpCompleteSpy);
      component.otpChange.subscribe(otpChangeSpy);

      paste('123456');
      otpCompleteSpy.mockClear();

      paste('789');

      expect(component.digits()).toEqual(['7', '8', '9', '', '', '']);
      expect(Array.from(inputs).map((input) => input.value)).toEqual(['7', '8', '9', '', '', '']);
      expect(otpChangeSpy).toHaveBeenLastCalledWith('789');
      expect(otpCompleteSpy).not.toHaveBeenCalled();
    });
  });

  // ─── onKeydown Backspace ─────────────────────────────────────────────────────

  describe('onKeydown() Backspace', () => {
    it('in a non-empty box clears the digit', () => {
      component.digits.update((d) => { const c = [...d]; c[0] = '5'; return c; });
      inputs[0].value = '5';
      fixture.detectChanges();

      inputs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
      fixture.detectChanges();

      expect(component.digits()[0]).toBe('');
    });

    it('in an empty box moves focus to the previous box', () => {
      component.digits.update((d) => { const c = [...d]; c[1] = ''; return c; });
      inputs[1].value = '';
      fixture.detectChanges();

      const focusSpy = jest.spyOn(inputs[0], 'focus');

      inputs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
      fixture.detectChanges();

      expect(focusSpy).toHaveBeenCalled();
    });
  });

  // ─── reset ──────────────────────────────────────────────────────────────────

  describe('reset()', () => {
    it('clears all digits', () => {
      component.digits.set(['1', '2', '3', '4', '5', '6']);
      inputs.forEach((inp, i) => (inp.value = String(i + 1)));
      fixture.detectChanges();

      component.reset();
      fixture.detectChanges();

      expect(component.digits()).toEqual(['', '', '', '', '', '']);
    });
  });

  // ─── otpComplete emission ────────────────────────────────────────────────────

  it('emits otpComplete exactly once when the 6th digit is entered', () => {
    const otpCompleteSpy = jest.fn();
    component.otpComplete.subscribe(otpCompleteSpy);

    // Fill the first 5 digits manually
    component.digits.set(['1', '2', '3', '4', '5', '']);
    ['1', '2', '3', '4', '5'].forEach((val, i) => {
      inputs[i].value = val;
    });
    fixture.detectChanges();

    // Enter the 6th digit via input event
    inputs[5].value = '6';
    inputs[5].dispatchEvent(new InputEvent('input', { bubbles: true }));
    fixture.detectChanges();

    expect(otpCompleteSpy).toHaveBeenCalledTimes(1);
    expect(otpCompleteSpy).toHaveBeenCalledWith('123456');
  });
});
