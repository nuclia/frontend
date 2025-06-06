import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalRef, PaButtonModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { DriverCreation, SqlDriver } from '@nuclia/core';

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
  isEdit: boolean;
  get config() {
    return this.modal.config.data;
  }

  constructor(public modal: ModalRef<SqlDriver>) {
    const driver = this.modal.config.data;
    this.isEdit = !!driver;
    if (!!driver) {
      const config = driver.config;
      this.form.patchValue({ name: driver.name, ...config });
    }
  }

  cancel() {
    this.modal.close();
  }

  submit() {
    if (this.form.valid) {
      const { name, ...config } = this.form.getRawValue();
      const driver: Omit<DriverCreation, 'identifier'> = {
        name,
        provider: 'sql',
        config,
      };
      this.modal.close(driver);
    }
  }
}
