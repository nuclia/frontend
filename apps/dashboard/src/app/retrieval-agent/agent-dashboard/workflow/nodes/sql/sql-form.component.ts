import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SDKService } from '@flaps/core';
import { OptionModel, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { map, Observable, switchMap, take } from 'rxjs';
import { ConfigurationFormComponent, FormDirective } from '../../basic-elements';

@Component({
  selector: 'app-sql-form',
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, PaTextFieldModule, ConfigurationFormComponent],
  templateUrl: './sql-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SqlFormComponent extends FormDirective {
  private sdk = inject(SDKService);

  override form = new FormGroup({
    sql: new FormGroup({
      source: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      prompt: new FormControl<string>('', { nonNullable: true }),
      retries: new FormControl<number>(3, { nonNullable: true, validators: [Validators.pattern('^[0-9]*$')] }),
    }),
  });
  override get configForm() {
    return this.form.controls.sql;
  }

  sourceOptions: Observable<OptionModel[]> = this.sdk.currentArag.pipe(
    take(1),
    switchMap((arag) => arag.getDrivers('sql')),
    map((drivers) => drivers.map((driver) => new OptionModel({ id: driver.id, label: driver.name, value: driver.id }))),
  );
}
