import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matRefreshRound } from '@ng-icons/material-icons/round';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmFieldImports } from '@nuclia/ui-spartan/field';
import { HlmInputImports } from '@nuclia/ui-spartan/input';
import { HlmLabelImports } from '@nuclia/ui-spartan/label';
import { HlmRadioGroupImports } from '@nuclia/ui-spartan/radio-group';
import { HlmTooltipImports } from '@nuclia/ui-spartan/tooltip';
import { controlValue } from '../../account-details.utils';

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

  private modeValue = controlValue(this.mode);
  protected isLimited = computed(() => this.modeValue() === 'limit');
}
