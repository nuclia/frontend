import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { StickyFooterComponent } from '@nuclia/sistema';

@Component({
  selector: 'nus-company-name',
  imports: [TranslatePipe, PaTextFieldModule, PaButtonModule, ReactiveFormsModule, StickyFooterComponent],
  templateUrl: './company-name.component.html',
  styleUrls: ['../_common-step.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyNameComponent {
  @Output() submit = new EventEmitter<string>();

  company = new FormControl<string>('', { nonNullable: true, validators: [Validators.required] });

  submitForm() {
    this.submit.emit(this.company.value);
  }
}
