import { CdkStepHeader, StepState } from '@angular/cdk/stepper';
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, numberAttribute } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matCheckRound, matErrorRound, matEditRound } from '@ng-icons/material-icons/round';
import { ButtonVariants, buttonVariants } from '@nuclia/ui-spartan/button';
import { UiStepLabel } from './ui-step-label';
import { UiStepperLabelPosition } from './ui-stepper';
import { injectUiStepperConfig } from './stepper.token';

export type UiStepperIndicatorMode = 'number' | 'state' | 'completion' | 'icon';

@Component({
  selector: 'ui-step-header',
  imports: [NgTemplateOutlet, NgIcon],
  providers: [provideIcons({ matCheckRound, matErrorRound, matEditRound })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'group inline-flex shrink-0 outline-none items-center gap-2 touch-manipulation transition-opacity data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
    '[class.flex-col]': 'labelPosition() === "bottom"',
    '[class.text-center]': 'labelPosition() === "bottom"',
    '[attr.data-disabled]': 'disabled() ? "true" : null',
  },
  template: `
    <span
      aria-hidden="true"
      hlmBtn
      [class]="_indicatorClass()">
      @if (_iconName(); as icon) {
        <ng-icon [name]="icon" />
      } @else {
        <span>{{ index() + 1 }}</span>
      }
    </span>

    <span
      class="flex min-w-0 touch-manipulation flex-col truncate text-sm font-medium"
      [class.text-destructive]="state() === 'error'">
      @if (_templateLabel(); as templateLabel) {
        <ng-container [ngTemplateOutlet]="templateLabel.template" />
      } @else if (_stringLabel(); as stringLabel) {
        {{ stringLabel }}
      }

      @if (_showOptionalLabel()) {
        <span class="text-muted-foreground text-xs">Optional</span>
      }

      @if (_showErrorLabel()) {
        <span class="text-destructive text-xs">{{ errorMessage() }}</span>
      }
    </span>
  `,
})
export class UiStepHeader extends CdkStepHeader {
  protected readonly _config = injectUiStepperConfig();

  public readonly state = input<StepState>('number');
  public readonly label = input<UiStepLabel | string | null>(null);
  public readonly errorMessage = input('');
  public readonly index = input(0, { transform: numberAttribute });
  public readonly selected = input(false, { transform: booleanAttribute });
  public readonly reached = input(false, { transform: booleanAttribute });
  public readonly active = input(false, { transform: booleanAttribute });
  public readonly optional = input(false, { transform: booleanAttribute });
  public readonly disabled = input(false, { transform: booleanAttribute });
  public readonly icon = input<string | null>(null);
  public readonly indicatorMode = input<UiStepperIndicatorMode>(this._config.defaultIndicatorMode);
  public readonly labelPosition = input<UiStepperLabelPosition>('end');

  protected readonly _stringLabel = computed(() => {
    const label = this.label();
    return typeof label === 'string' ? label : null;
  });

  protected readonly _templateLabel = computed(() => {
    const label = this.label();
    return label instanceof UiStepLabel ? label : null;
  });

  protected readonly _showOptionalLabel = computed(() => this.optional() && this.state() !== 'error');
  protected readonly _showErrorLabel = computed(() => this.state() === 'error' && !!this.errorMessage());

  // 'state' marks the steps that were reached, 'completion' only the completed ones (the CDK reports `done`/`edit` for a completed step that is not selected)
  protected readonly _isDone = computed(() =>
    this.indicatorMode() === 'completion'
      ? this.state() === 'done' || this.state() === 'edit'
      : this.selected() || this.reached(),
  );

  protected readonly _buttonVariant = computed<ButtonVariants['variant']>(() => {
    if (this.state() === 'error') {
      return 'destructive';
    }

    if (this.selected() || this._isDone()) {
      return 'default';
    }

    return 'outline';
  });

  protected readonly _indicatorClass = computed(
    () => `${buttonVariants({ size: 'icon-sm', variant: this._buttonVariant() })}`,
  );

  protected readonly _iconName = computed(() => {
    const state = this.state();
    const mode = this.indicatorMode();

    if (mode === 'number') {
      return null;
    }

    if (state === 'error') {
      return 'matErrorRound';
    }

    if (mode === 'state' || mode === 'completion') {
      if (!this._isDone()) {
        return null;
      }

      return 'matCheckRound';

      // TODO: to be discussed: should we follow the same ui as material stepper and show a pencil icon for edit state?
      // if (state === 'done') return 'matCheckRound';
      // if (state === 'edit') return 'matEditRound';
    }

    return this.icon();
  });
}
