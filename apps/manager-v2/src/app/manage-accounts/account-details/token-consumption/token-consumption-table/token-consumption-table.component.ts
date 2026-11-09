import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NucliaTokensDetails } from '@nuclia/core';
import { HlmTableImports } from '@nuclia/ui-spartan/table';
import { DIGITS_INFO, getTotalTokens } from '../token-consumption.utils';

@Component({
  selector: 'app-token-consumption-table',
  imports: [DecimalPipe, HlmTableImports],
  templateUrl: './token-consumption-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenConsumptionTableComponent {
  details = input.required<NucliaTokensDetails[]>();

  protected readonly digitsInfo = DIGITS_INFO;
  protected readonly getTotalTokens = getTotalTokens;
}
