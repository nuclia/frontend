import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';

import { AccountBudget } from '@flaps/core';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { InfoCardComponent } from '@nuclia/sistema';
import { BudgetComponent } from '../../account';

@Component({
  selector: 'app-step1-budget',
  imports: [BudgetComponent, InfoCardComponent, TranslatePipe, PaTextFieldModule, PaButtonModule],
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
