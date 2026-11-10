import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { AbstractControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matRefreshRound } from '@ng-icons/material-icons/round';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmInputImports } from '@nuclia/ui-spartan/input';
import { HlmLabelImports } from '@nuclia/ui-spartan/label';
import { HlmRadioGroupImports } from '@nuclia/ui-spartan/radio-group';
import { HlmTooltipImports } from '@nuclia/ui-spartan/tooltip';
import { controlValue, LimitMode } from '../../account-details.utils';

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
  private modeValue = controlValue<LimitMode>(() => this.form().get(`${this.limitKey()}-radio`));
  protected isLimited = computed(() => this.modeValue() === 'limit');
}
