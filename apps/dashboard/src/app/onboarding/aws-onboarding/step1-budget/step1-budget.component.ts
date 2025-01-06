import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoCardComponent } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-step1-budget',
  imports: [CommonModule, InfoCardComponent, TranslateModule, PaTextFieldModule, PaButtonModule, ReactiveFormsModule],
  templateUrl: './step1-budget.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Step1BudgetComponent {
  @Input() set data(value: number | null) {
    if (typeof value === 'number') {
      this.form.patchValue({ budget: value });
    }
  }

  @Output() next = new EventEmitter<{ budget: number | null }>();

  form = new FormGroup({
    budget: new FormControl<number | ''>('', { validators: [Validators.min(1)] }),
  });

  submitBudget() {
    this.next.emit({ budget: this.form.value.budget || null });
  }
}
