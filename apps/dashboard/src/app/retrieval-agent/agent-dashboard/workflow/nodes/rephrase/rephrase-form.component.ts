import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SDKService } from '@flaps/core';
import { OptionModel, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { NucliaDBDriver } from '@nuclia/core';
import { map, Observable, switchMap, take } from 'rxjs';
import { ConfigurationFormComponent, FormDirective } from '../../basic-elements';

@Component({
  selector: 'app-rephrase-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    PaTextFieldModule,
    PaTogglesModule,
    ConfigurationFormComponent,
  ],
  templateUrl: './rephrase-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RephraseFormComponent extends FormDirective {
  private sdk = inject(SDKService);

  override form = new FormGroup({
    rephrase: new FormGroup({
      prompt: new FormControl('', { validators: [Validators.required], nonNullable: true }),
      extend: new FormControl(false),
      kb: new FormControl('', { nonNullable: true }),
      synonyms: new FormControl(false),
      history: new FormControl(false),
      userInfo: new FormControl(false),
    }),
  });

  override get configForm() {
    return this.form.controls.rephrase;
  }

  sourceOptions: Observable<OptionModel[]> = this.sdk.currentArag.pipe(
    take(1),
    switchMap((arag) => arag.getDrivers('nucliadb') as Observable<NucliaDBDriver[]>),
    map((drivers) =>
      drivers.map((driver) => new OptionModel({ id: driver.id, label: driver.name, value: driver.config.kbid })),
    ),
  );
}
