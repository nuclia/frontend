import { CdkStep, CdkStepper, CdkStepperModule } from '@angular/cdk/stepper';
import { NgTemplateOutlet } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, input, numberAttribute, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { hlm } from '@nuclia/ui-spartan/utils';
import { cva } from 'class-variance-authority';
import { tap } from 'rxjs/operators';
import { UiStep } from './step/step.component';
import { UiStepHeader } from './step-header/step-header.component';
import { UiStepperHeaderPosition, UiStepperIndicatorMode, UiStepperLabelPosition } from './stepper.model';
import { injectUiStepperConfig } from './stepper.token';

const stepTransition = cva('', {
  variants: {
    motion: {
      none: '',
      'enter-forward': 'animate-in fade-in slide-in-from-right-8 fill-mode-both',
      'enter-backward': 'animate-in fade-in slide-in-from-left-8 fill-mode-both',
      'leave-forward': 'animate-out fade-out slide-out-to-left-8 fill-mode-both absolute top-0 right-0 left-0',
      'leave-backward': 'animate-out fade-out slide-out-to-right-8 fill-mode-both absolute top-0 right-0 left-0',
      'enter-bottom':
        'animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-400 [animation-timing-function:cubic-bezier(0.34,1.56,0.64,1)]',
    },
  },
  defaultVariants: { motion: 'none' },
});

@Component({
  selector: 'ui-stepper',
  imports: [CdkStepperModule, NgTemplateOutlet, UiStepHeader],
  providers: [{ provide: CdkStepper, useExisting: UiStepper }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stepper.component.html',
})
export class UiStepper extends CdkStepper {
  private readonly _config = injectUiStepperConfig();

  public readonly labelPosition = input<UiStepperLabelPosition>('end');
  public readonly headerPosition = input<UiStepperHeaderPosition>('top');
  public readonly indicatorMode = input<UiStepperIndicatorMode>('state');
  public readonly stepperAriaLabel = input<string | null>('Progress');
  public readonly stepperAriaLabelledby = input<string | null>(null);
  public readonly animationsEnabled = input(this._config.animationEnabled, { transform: booleanAttribute });
  public readonly animationDuration = input(this._config.animationDuration, { transform: numberAttribute });

  protected readonly _animationDirection = signal<'forward' | 'backward'>('forward');
  protected readonly _hasSelectionChanged = signal(false);

  constructor() {
    super();

    this.selectionChange
      .pipe(
        tap((event) => {
          if (event.previouslySelectedIndex >= 0 && event.selectedIndex !== event.previouslySelectedIndex) {
            this._hasSelectionChanged.set(true);
          }
          this._animationDirection.set(event.selectedIndex < event.previouslySelectedIndex ? 'backward' : 'forward');
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  override next(): void {
    const control = this.selected?.stepControl;
    if (control instanceof AbstractControl) {
      control.markAllAsTouched();
      control.updateValueAndValidity();
    }

    super.next();
  }

  protected stepIcon(step: CdkStep): string | null {
    return step instanceof UiStep ? step.icon() : null;
  }

  protected _enterAnimationClass(): string {
    if (!this._hasSelectionChanged()) {
      return '';
    }
    return stepTransition({ motion: this._animationDirection() === 'forward' ? 'enter-forward' : 'enter-backward' });
  }

  protected _leaveAnimationClass(): string {
    if (!this._hasSelectionChanged()) {
      return '';
    }
    return stepTransition({ motion: this._animationDirection() === 'forward' ? 'leave-forward' : 'leave-backward' });
  }

  protected _verticalStepClass(showConnector: boolean, index: number): string {
    return hlm(
      'ms-4 overflow-hidden ps-6',
      showConnector && 'border-s',
      this.animationsEnabled() && this.selectedIndex === index && stepTransition({ motion: 'enter-bottom' }),
    );
  }
}
