import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { STFUtils } from '@flaps/core';
import { ModalRef, PaButtonModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { SqlDriver } from '@nuclia/core';

@Component({
  selector: 'app-sql-driver',
  imports: [CommonModule, PaButtonModule, PaModalModule, PaTextFieldModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './sql-driver-modal.component.html',
  styleUrl: '../driver-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SqlDriverModalComponent {
  form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    dsn: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    sql_schema: new FormControl<string | null>(null),
  });

  constructor(public modal: ModalRef) {}

  cancel() {
    this.modal.close();
  }

  submit() {
    if (this.form.valid) {
      const { name, ...config } = this.form.getRawValue();
      const driver: SqlDriver = {
        id: `${STFUtils.generateSlug(name)}_${STFUtils.generateRandomSlugSuffix()}`,
        name,
        provider: 'sql',
        config,
      };
      this.modal.close(driver);
    }
  }
}
