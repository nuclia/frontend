import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { PaDemoModule } from '@guillotinaweb/pastanaga-angular/demo';
import { CountrySelectComponent } from '@nuclia/sistema';

@Component({
  selector: 'nsd-sistema-country-select',
  templateUrl: './sistema-country-select.component.html',
  styleUrl: './sistema-country-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaDemoModule, CountrySelectComponent, FormsModule, ReactiveFormsModule, PaTogglesModule],
})
export class SistemaCountrySelectComponent {
  disabled = false;
  readonly = false;
  countryControl = new FormControl<string>('');
  formGroup = new FormGroup({
    country: new FormControl<string>(''),
  });

  formControlCode = `// TypeScript
countryControl = new FormControl('');

// Template
<label class="title-s" for="country">Country</label>
<nsi-country-select
  [id]="'country'"
  [formControl]="countryControl"
  [externalLabel]="true">
</nsi-country-select>`;

  formGroupCode = `// TypeScript
formGroup = new FormGroup({
  country: new FormControl(''),
});

// Template
<form [formGroup]="formGroup">
  <label class="title-s" for="country">Country</label>
  <nsi-country-select
    [id]="'country'"
    formControlName="country"
    [externalLabel]="true">
  </nsi-country-select>
</form>`;

  readonlyCode = `<nsi-country-select
  [formControl]="countryControl"
  [readonly]="true"
  [externalLabel]="true">
</nsi-country-select>`;
}
