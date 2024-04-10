import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KbConfiguration, Zone } from '@flaps/core';
import { PaButtonModule, PaIconModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LanguageFieldComponent } from '../language-field/language-field.component';

@Component({
  selector: 'nus-onboarding-step2',
  standalone: true,
  imports: [
    CommonModule,
    PaButtonModule,
    PaIconModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TranslateModule,
    LanguageFieldComponent,
  ],
  templateUrl: './step2.component.html',
  styleUrls: ['../_common-step.scss', './step2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Step2Component {
  @Input()
  set zones(zones: Zone[] | null) {
    if (zones) {
      this._zones = zones;
      const validZones = zones.filter((zone) => !zone.notAvailableYet);
      if (validZones.length === 1) {
        this.configurationForm.controls.region.patchValue(validZones[0].slug);
      }
    }
  }
  get zones() {
    return this._zones;
  }

  @Output() submitStep2 = new EventEmitter<KbConfiguration>();

  private _zones: Zone[] = [];

  configurationForm = new FormGroup({
    region: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  semanticModel = '';
  multilingualSelected = true;
  languages: string[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  submitForm() {
    const configFormValue = this.configurationForm.getRawValue();
    const configuration: KbConfiguration = {
      zoneSlug: configFormValue.region,
      semanticModel: this.semanticModel,
      multilingual: this.multilingualSelected,
      languages: this.languages,
    };
    this.submitStep2.emit(configuration);
  }

  updateLanguages(data: { semanticModel: string; multilingualSelected: boolean; languages: string[] }) {
    this.semanticModel = data.semanticModel;
    this.multilingualSelected = data.multilingualSelected;
    this.languages = data.languages;
    this.cdr.markForCheck();
  }
}
