import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoCardComponent } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-step1-budget',
  standalone: true,
  imports: [CommonModule, InfoCardComponent, TranslateModule, PaTextFieldModule, PaButtonModule, ReactiveFormsModule],
  templateUrl: './step1-budget.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Step1BudgetComponent {
  @Output() next = new EventEmitter<{ budget: number | null }>();

  form = new FormGroup({
    budget: new FormControl<number | null>(null),
  });

  submitBudget() {
    this.next.emit(this.form.getRawValue());
  }
}
