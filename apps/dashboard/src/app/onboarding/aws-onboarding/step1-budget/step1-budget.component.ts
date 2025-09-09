import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { InfoCardComponent } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { BudgetComponent } from '../../../account/billing/usage/budget.component';
import { AccountBudget } from '@flaps/core';

@Component({
  selector: 'app-step1-budget',
  imports: [BudgetComponent, InfoCardComponent, TranslateModule, PaTextFieldModule, PaButtonModule],
  templateUrl: './step1-budget.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Step1BudgetComponent {
  @Output() next = new EventEmitter<Partial<AccountBudget>>();

  budget?: Partial<AccountBudget>;

  submit() {
    this.next.emit(this.budget);
  }
}
