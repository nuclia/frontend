import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matRefreshRound } from '@ng-icons/material-icons/round';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmFieldImports } from '@nuclia/ui-spartan/field';
import { HlmInputImports } from '@nuclia/ui-spartan/input';
import { HlmLabelImports } from '@nuclia/ui-spartan/label';
import { HlmRadioGroupImports } from '@nuclia/ui-spartan/radio-group';
import { HlmTooltipImports } from '@nuclia/ui-spartan/tooltip';

@Component({
  selector: 'app-limit-field',
  templateUrl: './limit-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    HlmButtonImports,
    HlmFieldImports,
    HlmInputImports,
    HlmLabelImports,
    HlmRadioGroupImports,
    HlmTooltipImports,
    NgIcon,
  ],
  providers: [provideIcons({ matRefreshRound })],
})
export class LimitFieldComponent {
  label = input.required<string>();
  inputLabel = input.required<string>();
  idPrefix = input.required<string>();
  mode = input.required<FormControl<'limit' | 'unlimited'>>();
  limit = input.required<FormControl<number>>();
  resetToDefault = output();

  protected isLimited = signal(false);

  constructor() {
    // the control is patched programmatically, so mirror its value into a signal for the OnPush view
    effect((onCleanup) => {
      const mode = this.mode();
      this.isLimited.set(mode.value === 'limit');
      const subscription = mode.valueChanges.subscribe((value) => this.isLimited.set(value === 'limit'));
      onCleanup(() => subscription.unsubscribe());
    });
  }
}
