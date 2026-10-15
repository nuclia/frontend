import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { PaButtonModule, PaChipsModule, PaDateTimeModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { LABEL_COLORS } from '@nuclia/sistema';
import { NonOperatorFilterExpression } from '../filter-expression-modal.component';

@Component({
  imports: [PaButtonModule, PaChipsModule, PaDateTimeModule, TranslatePipe],
  selector: 'stf-filter-value',
  templateUrl: './filter-value.component.html',
  styleUrl: './filter-value.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterValueComponent {
  chipColor = LABEL_COLORS[0].mainColor;
  filter = input.required<NonOperatorFilterExpression>();
}
