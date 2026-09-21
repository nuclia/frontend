import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { StickyFooterComponent } from '@nuclia/sistema';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'nus-company-name',
  imports: [TranslateModule, PaTextFieldModule, PaButtonModule, ReactiveFormsModule, StickyFooterComponent],
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
