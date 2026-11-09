import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { AbstractControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matRefreshRound } from '@ng-icons/material-icons/round';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmInputImports } from '@nuclia/ui-spartan/input';
import { HlmLabelImports } from '@nuclia/ui-spartan/label';
import { HlmRadioGroupImports } from '@nuclia/ui-spartan/radio-group';
import { HlmTooltipImports } from '@nuclia/ui-spartan/tooltip';

@Component({
  selector: 'app-limit-row',
  templateUrl: './limit-row.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
    HlmRadioGroupImports,
    HlmTooltipImports,
    NgIcon,
  ],
  providers: [provideIcons({ matRefreshRound })],
})
export class LimitRowComponent {
  limitKey = input.required<string>();
  group = input.required<AbstractControl>();
  resetToDefault = output();

  protected form = computed(() => this.group() as FormGroup);
  protected isLimited = signal(false);

  constructor() {
    // the control is patched programmatically, so mirror its value into a signal for the OnPush view
    effect((onCleanup) => {
      const mode = this.form().get(`${this.limitKey()}-radio`);
      if (!mode) {
        return;
      }
      this.isLimited.set(mode.value === 'limit');
      const subscription = mode.valueChanges.subscribe((value) => this.isLimited.set(value === 'limit'));
      onCleanup(() => subscription.unsubscribe());
    });
  }
}
