import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { InfoCardComponent } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { AccountBudget } from '@flaps/core';
import { BudgetComponent } from '../../account';

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
